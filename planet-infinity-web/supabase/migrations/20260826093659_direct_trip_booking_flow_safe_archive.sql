-- Direct trip bookings are the default. Applications remain an explicit, rare gate.

alter table public.trips alter column booking_mode set default 'booking';

update public.trips
set booking_mode = 'booking'
where not application_required
  and booking_mode = 'request';

alter table public.payments
  add column if not exists payment_proof_path text;

alter table public.payments
  drop constraint if exists payments_payment_proof_path_check;
alter table public.payments
  add constraint payments_payment_proof_path_check
  check (
    payment_proof_path is null
    or payment_proof_path ~ '^pending/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
  );

alter table public.bookings
  add column if not exists whatsapp_opt_in boolean not null default false,
  add column if not exists whatsapp_opted_in_at timestamptz;

alter table public.bookings
  drop constraint if exists bookings_whatsapp_consent_check;
alter table public.bookings
  add constraint bookings_whatsapp_consent_check
  check (
    (whatsapp_opt_in and whatsapp_opted_in_at is not null)
    or (not whatsapp_opt_in and whatsapp_opted_in_at is null)
  );

alter table public.requests
  add column if not exists archived_at timestamptz;

create index if not exists requests_active_created_at_idx
  on public.requests(created_at desc)
  where archived_at is null;

alter table public.trip_seat_reservations
  alter column request_id drop not null;

create or replace function private.submit_public_trip_booking(
  p_trip_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_guest_count integer,
  p_selections jsonb,
  p_notes text,
  p_policy_slugs text[],
  p_whatsapp_opt_in boolean default false
)
returns table (id uuid, booking_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_booking public.bookings;
  v_trip public.trips;
  v_required text[] := array['booking', 'cancellation', 'refund', 'payment', 'terms', 'etiquette', 'privacy'];
  v_policy public.policies;
  v_selections jsonb := coalesce(p_selections, '{}'::jsonb);
  v_payment jsonb;
  v_payment_method text;
  v_payment_path text;
  v_fields jsonb := '[]'::jsonb;
  v_answers jsonb := '{}'::jsonb;
  v_field jsonb;
  v_answer jsonb;
  v_seats jsonb := '[]'::jsonb;
  v_seat_count integer := 0;
  v_booked_guests integer := 0;
  v_total numeric;
begin
  if char_length(trim(coalesce(p_full_name, ''))) not between 2 and 120 then raise exception 'A valid name is required'; end if;
  if char_length(trim(coalesce(p_email, ''))) > 254 or coalesce(p_email, '') !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'A valid email is required'; end if;
  if char_length(trim(coalesce(p_phone, ''))) > 40 then raise exception 'Phone number is too long'; end if;
  if coalesce(p_whatsapp_opt_in, false) and char_length(trim(coalesce(p_phone, ''))) < 6 then raise exception 'A WhatsApp number is required for WhatsApp updates'; end if;
  if p_guest_count is null or p_guest_count < 1 or p_guest_count > 80 then raise exception 'Guest count must be between 1 and 80'; end if;
  if char_length(trim(coalesce(p_notes, ''))) > 2000 then raise exception 'Notes are too long'; end if;
  if jsonb_typeof(v_selections) <> 'object' or pg_column_size(v_selections) > 20000 then raise exception 'Selection details are invalid'; end if;
  if not v_required <@ coalesce(p_policy_slugs, array[]::text[]) then raise exception 'Required policies must be accepted'; end if;

  if exists (
    select 1
    from unnest(v_required) as required_policy(slug)
    left join public.policies policy on policy.slug = required_policy.slug
    where policy.id is null or not policy.is_active or btrim(policy.body) = ''
  ) then raise exception 'Required policies are not published'; end if;

  select trip.* into v_trip
  from public.trips trip
  where trip.id = p_trip_id
    and trip.is_published
  for update;

  if v_trip.id is null then raise exception 'Trip is unavailable'; end if;
  if v_trip.application_required or v_trip.booking_mode <> 'booking' then raise exception 'This trip requires an application'; end if;
  if v_trip.price_egp is null or v_trip.price_egp <= 0 then raise exception 'Trip price is unavailable'; end if;

  select coalesce(sum(existing_booking.guest_count), 0)::integer
    into v_booked_guests
  from public.bookings existing_booking
  where existing_booking.trip_id = v_trip.id
    and existing_booking.status in ('pending', 'confirmed');

  if v_trip.capacity is not null and v_booked_guests + p_guest_count > v_trip.capacity then
    raise exception 'This trip does not have enough availability';
  end if;

  v_fields := coalesce(v_trip.booking_form_fields, '[]'::jsonb);
  v_answers := coalesce(v_selections -> 'customAnswers', '{}'::jsonb);
  if jsonb_typeof(v_answers) <> 'object' then raise exception 'Invalid custom booking answers'; end if;
  for v_field in select value from jsonb_array_elements(v_fields)
  loop
    if coalesce((v_field ->> 'required')::boolean, false) then
      v_answer := v_answers -> (v_field ->> 'id');
      if v_answer is null
         or v_answer = 'null'::jsonb
         or (jsonb_typeof(v_answer) = 'string' and btrim(v_answer #>> '{}') = '')
         or (jsonb_typeof(v_answer) = 'array' and jsonb_array_length(v_answer) = 0)
         or (v_field ->> 'type' = 'checkbox' and v_answer <> 'true'::jsonb)
      then raise exception 'A required trip question is missing'; end if;
    end if;
  end loop;

  v_payment := v_selections -> 'paymentProof';
  if v_trip.payment_proof_required and (v_payment is null or jsonb_typeof(v_payment) <> 'object') then
    raise exception 'Payment proof is required for this trip';
  end if;
  if v_payment is not null then
    if jsonb_typeof(v_payment) <> 'object' then raise exception 'Invalid payment proof'; end if;
    v_payment_method := nullif(trim(v_payment ->> 'method'), '');
    v_payment_path := nullif(trim(v_payment ->> 'path'), '');
    if v_payment_method is null or v_payment_method not in ('instapay', 'vodafone_cash') or v_payment_path is null then raise exception 'Invalid payment proof'; end if;
    if v_payment_path !~ '^pending/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then raise exception 'Invalid payment proof'; end if;
    if not exists (
      select 1 from storage.objects object
      where object.bucket_id = 'payment-proofs' and object.name = v_payment_path
    ) then raise exception 'Payment receipt upload is missing'; end if;
  end if;

  if v_trip.seat_selection_enabled then
    if jsonb_typeof(v_selections -> 'seats') = 'array' then v_seats := v_selections -> 'seats'; end if;
    v_seat_count := jsonb_array_length(v_seats);
    if v_seat_count <> p_guest_count then raise exception 'Choose one seat for every guest'; end if;
    if exists (
      select 1 from jsonb_array_elements_text(v_seats) seat(value)
      where not case when seat.value ~ '^[0-9]+$' then seat.value::integer between 1 and least(coalesce(v_trip.capacity, 80), 80) else false end
    ) then raise exception 'The selected seat is invalid'; end if;
    if (select count(distinct seat.value::integer) from jsonb_array_elements_text(v_seats) seat(value)) <> v_seat_count then
      raise exception 'Choose each seat only once';
    end if;
  elsif jsonb_typeof(v_selections -> 'seats') = 'array' then
    raise exception 'Seat selection is not enabled for this trip';
  end if;

  if exists (
    select 1
    from public.bookings existing_booking
    join public.customers existing_customer on existing_customer.id = existing_booking.customer_id
    where existing_customer.email = lower(trim(p_email))
      and existing_booking.trip_id = v_trip.id
      and existing_booking.created_at > now() - interval '5 minutes'
  ) then raise exception 'Please wait before submitting the same booking again'; end if;

  insert into public.customers as customer(full_name, email, phone, auth_user_id)
  values (trim(p_full_name), lower(trim(p_email)), nullif(trim(coalesce(p_phone, '')), ''), null)
  on conflict (lower(email)) do update set
    full_name = excluded.full_name,
    phone = coalesce(excluded.phone, customer.phone),
    updated_at = now()
  returning customer.id into v_customer_id;

  v_total := v_trip.price_egp * p_guest_count;
  insert into public.bookings(
    customer_id, booking_type, status, trip_id, scheduled_at, guest_count,
    selections, total_amount, currency, notes, whatsapp_opt_in, whatsapp_opted_in_at
  ) values (
    v_customer_id, 'trip', 'pending', v_trip.id, v_trip.departure_at, p_guest_count,
    v_selections, v_total, 'EGP', nullif(trim(coalesce(p_notes, '')), ''),
    coalesce(p_whatsapp_opt_in, false), case when coalesce(p_whatsapp_opt_in, false) then now() end
  ) returning * into v_booking;

  insert into public.booking_guests(booking_id, full_name, is_primary)
  values (v_booking.id, trim(p_full_name), true);

  if v_payment_path is not null then
    insert into public.payments(
      booking_id, amount, currency, payment_method, status, provider,
      gateway_status, payment_proof_path, notes
    ) values (
      v_booking.id, v_total, 'EGP', v_payment_method, 'pending', 'manual',
      'pending', v_payment_path, 'Customer receipt awaiting admin verification.'
    );
  end if;

  if v_trip.seat_selection_enabled then
    update public.trip_seat_reservations
    set status = 'expired'
    where trip_id = v_trip.id and status = 'held' and hold_expires_at <= now();
    begin
      insert into public.trip_seat_reservations(trip_id, request_id, booking_id, seat_number, status, hold_expires_at)
      select v_trip.id, null, v_booking.id, seat.value::integer, 'reserved', null
      from jsonb_array_elements_text(v_seats) seat(value);
    exception when unique_violation then
      raise exception 'One of those seats was just taken. Please choose again';
    end;
  end if;

  for v_policy in select * from public.policies where slug = any(v_required) and is_active
  loop
    insert into public.policy_acceptances(policy_id, policy_version, customer_id, booking_id)
    values (v_policy.id, v_policy.version, v_customer_id, v_booking.id);
  end loop;

  if (select count(*) from public.policy_acceptances where booking_id = v_booking.id) <> cardinality(v_required) then
    raise exception 'A required policy is not active';
  end if;

  return query select v_booking.id, v_booking.booking_number;
end;
$$;

revoke all on function private.submit_public_trip_booking(uuid, text, text, text, integer, jsonb, text, text[], boolean) from public, anon, authenticated;
grant execute on function private.submit_public_trip_booking(uuid, text, text, text, integer, jsonb, text, text[], boolean) to anon, authenticated;

create or replace function public.submit_public_trip_booking(
  p_trip_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_guest_count integer,
  p_selections jsonb,
  p_notes text,
  p_policy_slugs text[],
  p_whatsapp_opt_in boolean default false
)
returns table (id uuid, booking_number text)
language sql
security invoker
set search_path = ''
as $$
  select * from private.submit_public_trip_booking(
    p_trip_id, p_full_name, p_email, p_phone, p_guest_count,
    p_selections, p_notes, p_policy_slugs, p_whatsapp_opt_in
  );
$$;

revoke all on function public.submit_public_trip_booking(uuid, text, text, text, integer, jsonb, text, text[], boolean) from public, anon, authenticated;
grant execute on function public.submit_public_trip_booking(uuid, text, text, text, integer, jsonb, text, text[], boolean) to anon, authenticated;

comment on function public.submit_public_trip_booking(uuid, text, text, text, integer, jsonb, text, text[], boolean) is
  'Creates a direct trip booking with a pending manual payment receipt; application-only trips are rejected.';

-- Preserve existing paid-intent submissions while moving them out of Requests.
do $$
declare
  source_request public.requests;
  new_booking_id uuid;
  new_total numeric;
begin
  for source_request in
    select request.*
    from public.requests request
    join public.trips trip on trip.id = request.trip_id
    where request.request_type = 'trip'
      and not trip.application_required
      and request.payment_proof_path is not null
      and not exists (select 1 from public.bookings booking where booking.request_id = request.id)
  loop
    select trip.price_egp * coalesce(source_request.guest_count, 1)
      into new_total
    from public.trips trip where trip.id = source_request.trip_id;

    insert into public.bookings(
      customer_id, booking_type, status, trip_id, scheduled_at, guest_count,
      selections, total_amount, currency, notes, whatsapp_opt_in, whatsapp_opted_in_at
    ) values (
      source_request.customer_id, 'trip', 'pending', source_request.trip_id,
      source_request.travel_or_event_at, coalesce(source_request.guest_count, 1),
      source_request.selections || jsonb_build_object('convertedFromRequest', source_request.request_number),
      new_total, 'EGP', source_request.notes, source_request.whatsapp_opt_in,
      source_request.whatsapp_opted_in_at
    ) returning id into new_booking_id;

    insert into public.booking_guests(booking_id, full_name, is_primary)
    values (new_booking_id, source_request.contact_name, true);

    insert into public.payments(
      booking_id, amount, currency, payment_method, status, provider,
      gateway_status, payment_proof_path, notes
    ) values (
      new_booking_id, new_total, 'EGP', source_request.payment_method,
      'pending', 'manual', 'pending', source_request.payment_proof_path,
      'Customer receipt awaiting admin verification.'
    );

    update public.policy_acceptances
    set booking_id = new_booking_id, request_id = null
    where request_id = source_request.id;

    update public.trip_seat_reservations
    set booking_id = new_booking_id, request_id = null, status = 'reserved', hold_expires_at = null
    where request_id = source_request.id;

    update public.requests
    set archived_at = now(), status = 'confirmed'
    where id = source_request.id;
  end loop;
end;
$$;
