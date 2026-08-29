-- Generic per-guest add-ons and a complete guest roster for every direct booking.

alter table public.booking_guests
  add column if not exists phone text;

alter table public.booking_guests
  drop constraint if exists booking_guests_phone_check;
alter table public.booking_guests
  add constraint booking_guests_phone_check
  check (phone is null or char_length(trim(phone)) between 6 and 40);

create or replace function private.trip_booking_addons_total(
  p_fields jsonb, p_answers jsonb, p_guest_count integer
)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
  field jsonb;
  option jsonb;
  answer jsonb;
  quantity integer;
  total numeric := 0;
begin
  if jsonb_typeof(coalesce(p_fields, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_answers, '{}'::jsonb)) <> 'object'
     or p_guest_count not between 1 and 80 then
    raise exception 'Invalid custom booking answers';
  end if;

  for field in select value from jsonb_array_elements(p_fields)
  loop
    answer := p_answers -> (field ->> 'id');
    if field ->> 'type' = 'quantity' then
      if answer is not null and jsonb_typeof(answer) <> 'object' then
        raise exception 'Invalid add-on quantities';
      end if;
      quantity := 0;
      for option in select value from jsonb_array_elements(coalesce(field -> 'options', '[]'::jsonb))
      loop
        if answer ? (option ->> 'id') then
          if (answer ->> (option ->> 'id')) !~ '^[0-9]+$' then raise exception 'Invalid add-on quantity'; end if;
          if (answer ->> (option ->> 'id'))::integer > p_guest_count then raise exception 'Add-on quantity exceeds guest count'; end if;
          quantity := quantity + (answer ->> (option ->> 'id'))::integer;
          total := total + coalesce((option ->> 'priceEgp')::numeric, 0) * (answer ->> (option ->> 'id'))::integer;
        end if;
      end loop;
      if coalesce((field ->> 'required')::boolean, false) and quantity = 0 then
        raise exception 'A required trip question is missing';
      end if;
    else
      if coalesce((field ->> 'required')::boolean, false)
         and (answer is null or answer = 'null'::jsonb
           or (jsonb_typeof(answer) = 'string' and btrim(answer #>> '{}') = '')
           or (jsonb_typeof(answer) = 'array' and jsonb_array_length(answer) = 0)) then
        raise exception 'A required trip question is missing';
      end if;
      for option in select value from jsonb_array_elements(coalesce(field -> 'options', '[]'::jsonb))
      loop
        if jsonb_typeof(option) = 'object' and coalesce((option ->> 'priceEgp')::numeric, 0) > 0
          and ((jsonb_typeof(answer) = 'string' and answer #>> '{}' = option ->> 'id')
            or (jsonb_typeof(answer) = 'array' and exists (select 1 from jsonb_array_elements_text(answer) value where value = option ->> 'id')))
        then
          total := total + (option ->> 'priceEgp')::numeric * p_guest_count;
        end if;
      end loop;
    end if;
  end loop;
  return total;
end;
$$;

create or replace function private.submit_public_trip_booking(
  p_trip_id uuid, p_full_name text, p_email text, p_phone text, p_guest_count integer,
  p_selections jsonb, p_notes text, p_policy_slugs text[], p_whatsapp_opt_in boolean default false
)
returns table (id uuid, booking_number text)
language plpgsql security definer set search_path = ''
as $$
declare
  trip public.trips;
  booking public.bookings;
  customer_id uuid;
  answers jsonb := coalesce(p_selections -> 'customAnswers', '{}'::jsonb);
  roster jsonb := coalesce(p_selections -> 'guestRoster', '[]'::jsonb);
  guest jsonb;
  guest_index integer := 0;
  selections jsonb := coalesce(p_selections, '{}'::jsonb) - 'seats';
  payment jsonb;
  payment_path text;
  payment_method text;
  addons numeric := 0;
  total numeric;
  policy public.policies;
  group_value jsonb;
  choice_value jsonb;
  choice_id text;
  selected_departure_at timestamptz;
  required text[] := array['booking','cancellation','refund','payment','terms','etiquette','privacy'];
begin
  if char_length(trim(coalesce(p_full_name,''))) not between 2 and 120 then raise exception 'A valid name is required'; end if;
  if coalesce(p_email,'') !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'A valid email is required'; end if;
  if p_guest_count is null or p_guest_count not between 1 and 80 then raise exception 'Guest count must be between 1 and 80'; end if;
  if jsonb_typeof(roster) <> 'array' or jsonb_array_length(roster) <> p_guest_count then raise exception 'Enter every guest name and phone number'; end if;
  for guest in select value from jsonb_array_elements(roster) loop
    if jsonb_typeof(guest) <> 'object'
      or char_length(trim(coalesce(guest ->> 'name',''))) not between 2 and 120
      or char_length(trim(coalesce(guest ->> 'phone',''))) not between 6 and 40 then
      raise exception 'Enter every guest name and phone number';
    end if;
  end loop;
  if jsonb_typeof(coalesce(p_selections,'{}'::jsonb)) <> 'object' or pg_column_size(coalesce(p_selections,'{}'::jsonb)) > 20000 then raise exception 'Selection details are invalid'; end if;
  if not required <@ coalesce(p_policy_slugs, array[]::text[]) then raise exception 'Required policies must be accepted'; end if;
  if exists (select 1 from unnest(required) rp left join public.policies p on p.slug=rp where p.id is null or not p.is_active or btrim(p.body)='') then raise exception 'Required policies are not published'; end if;

  select * into trip from public.trips where id=p_trip_id and is_published for update;
  if trip.id is null or trip.application_required or trip.booking_mode <> 'booking' or trip.price_egp is null or trip.price_egp <= 0 then raise exception 'Trip is unavailable'; end if;
  selected_departure_at := trip.departure_at;
  for group_value in select value from jsonb_array_elements(coalesce(trip.options, '[]'::jsonb)) loop
    if group_value ->> 'kind' = 'date' then
      choice_id := p_selections #>> array['selected', group_value ->> 'id'];
      if coalesce(choice_id, '') = '' then raise exception 'Choose a departure date'; end if;
      select value into choice_value from jsonb_array_elements(coalesce(group_value -> 'choices', '[]'::jsonb)) where value ->> 'id' = choice_id limit 1;
      if choice_value is null or nullif(choice_value ->> 'scheduledAt', '') is null then raise exception 'Choose a valid departure date'; end if;
      selected_departure_at := (choice_value ->> 'scheduledAt')::timestamptz;
    end if;
  end loop;
  if selected_departure_at is null then raise exception 'Trip departure is unavailable'; end if;
  if trip.capacity is not null and (select coalesce(sum(b.guest_count),0) from public.bookings b where b.trip_id=trip.id and b.scheduled_at=selected_departure_at and b.status in ('pending','confirmed')) + p_guest_count > trip.capacity then raise exception 'This departure does not have enough availability'; end if;

  addons := private.trip_booking_addons_total(coalesce(trip.booking_form_fields,'[]'::jsonb), answers, p_guest_count);
  payment := selections -> 'paymentProof';
  if trip.payment_proof_required and (payment is null or jsonb_typeof(payment) <> 'object') then raise exception 'Payment proof is required for this trip'; end if;
  if payment is not null then
    payment_path := nullif(trim(payment ->> 'path'),''); payment_method := nullif(trim(payment ->> 'method'),'');
    if payment_path is null or payment_method not in ('instapay','vodafone_cash') or payment_path !~ '^pending/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then raise exception 'Invalid payment proof'; end if;
    if not exists (select 1 from storage.objects where bucket_id='payment-proofs' and name=payment_path) then raise exception 'Payment receipt upload is missing'; end if;
  end if;
  if exists (select 1 from public.bookings b join public.customers c on c.id=b.customer_id where c.email=lower(trim(p_email)) and b.trip_id=trip.id and b.scheduled_at=selected_departure_at and b.created_at > now()-interval '5 minutes') then raise exception 'Please wait before submitting the same booking again'; end if;
  insert into public.customers as c(full_name,email,phone,auth_user_id) values(trim(p_full_name),lower(trim(p_email)),nullif(trim(coalesce(p_phone,'')),''),null) on conflict(lower(email)) do update set full_name=excluded.full_name, phone=coalesce(excluded.phone,c.phone), updated_at=now() returning c.id into customer_id;
  total := trip.price_egp * p_guest_count + addons;
  insert into public.bookings(customer_id,booking_type,status,trip_id,scheduled_at,guest_count,selections,total_amount,currency,notes,whatsapp_opt_in,whatsapp_opted_in_at) values(customer_id,'trip','pending',trip.id,selected_departure_at,p_guest_count,selections,total,'EGP',nullif(trim(coalesce(p_notes,'')),''),coalesce(p_whatsapp_opt_in,false),case when coalesce(p_whatsapp_opt_in,false) then now() end) returning * into booking;
  for guest in select value from jsonb_array_elements(roster) loop
    insert into public.booking_guests(booking_id,full_name,phone,is_primary) values(booking.id,trim(guest ->> 'name'),trim(guest ->> 'phone'),guest_index=0);
    guest_index := guest_index + 1;
  end loop;
  if payment_path is not null then insert into public.payments(booking_id,amount,currency,payment_method,status,provider,gateway_status,payment_proof_path,notes) values(booking.id,total,'EGP',payment_method,'pending','manual','pending',payment_path,'Customer receipt awaiting admin verification.'); end if;
  for policy in select * from public.policies where slug=any(required) and is_active loop insert into public.policy_acceptances(policy_id,policy_version,customer_id,booking_id) values(policy.id,policy.version,customer_id,booking.id); end loop;
  return query select booking.id, booking.booking_number;
end;
$$;

revoke all on function private.trip_booking_addons_total(jsonb, jsonb, integer) from public, anon, authenticated;

-- Wadi starts with the requested foreigner tiers. Admins can remove, rename,
-- reprice, or add the same generic quantity field on any other trip.
update public.trips
set booking_form_fields = coalesce(booking_form_fields, '[]'::jsonb) || jsonb_build_array(
  jsonb_build_object(
    'id', 'foreigner-pricing',
    'label', 'Foreigner pricing',
    'type', 'quantity',
    'required', false,
    'help', 'Choose how many foreign guests are using each available price tier.',
    'options', jsonb_build_array(
      jsonb_build_object('id', 'foreigner-early-bird', 'label', 'Foreigner · Early Bird', 'priceEgp', 600),
      jsonb_build_object('id', 'foreigner-regular', 'label', 'Foreigner · Regular', 'priceEgp', 1100)
    )
  )
)
where slug = 'wadi-el-hitan-nocturne'
  and not coalesce(booking_form_fields, '[]'::jsonb) @> '[{"id":"foreigner-pricing"}]'::jsonb;
