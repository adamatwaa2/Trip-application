-- Two departures share one trip page, but every booking and paid seat remains
-- tied to the exact departure the guest selected.

alter table public.trip_seat_reservations
  add column if not exists scheduled_at timestamptz;

update public.trip_seat_reservations reservation
set scheduled_at = booking.scheduled_at
from public.bookings booking
where reservation.booking_id = booking.id
  and reservation.scheduled_at is null;

drop index if exists public.trip_seat_reservations_active_seat_key;
create unique index trip_seat_reservations_active_departure_seat_key
  on public.trip_seat_reservations (trip_id, scheduled_at, seat_number)
  where status in ('held', 'reserved');

update public.trips
set options = jsonb_build_array(
  jsonb_build_object(
    'id', 'departure',
    'kind', 'date',
    'label', 'Choose your departure',
    'hint', 'Both departures are 2 days / 1 night. Choose the one that works for you.',
    'required', true,
    'choices', jsonb_build_array(
      jsonb_build_object(
        'id', 'wadi-2026-09-10',
        'label', 'Thursday, 10 September 2026',
        'detail', 'Departs 16:30 · Returns Friday, 11 September 2026 at 15:15',
        'scheduledAt', '2026-09-10T16:30:00+03:00'
      ),
      jsonb_build_object(
        'id', 'wadi-2026-09-11',
        'label', 'Friday, 11 September 2026',
        'detail', 'Departs 16:30 · Returns Saturday, 12 September 2026 at 15:15',
        'scheduledAt', '2026-09-11T16:30:00+03:00'
      )
    )
  )
)
where slug = 'wadi-el-hitan-nocturne';

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
      select value into choice_value
      from jsonb_array_elements(coalesce(group_value -> 'choices', '[]'::jsonb))
      where value ->> 'id' = choice_id
      limit 1;
      if choice_value is null or nullif(choice_value ->> 'scheduledAt', '') is null then raise exception 'Choose a valid departure date'; end if;
      selected_departure_at := (choice_value ->> 'scheduledAt')::timestamptz;
    end if;
  end loop;
  if selected_departure_at is null then raise exception 'Trip departure is unavailable'; end if;

  if trip.capacity is not null and (select coalesce(sum(b.guest_count),0) from public.bookings b where b.trip_id=trip.id and b.scheduled_at=selected_departure_at and b.status in ('pending','confirmed')) + p_guest_count > trip.capacity then raise exception 'This departure does not have enough availability'; end if;
  addons := private.trip_booking_addons(coalesce(trip.booking_form_fields,'[]'::jsonb), answers);
  payment := selections -> 'paymentProof';
  if trip.payment_proof_required and (payment is null or jsonb_typeof(payment) <> 'object') then raise exception 'Payment proof is required for this trip'; end if;
  if payment is not null then
    payment_path := nullif(trim(payment ->> 'path'),''); payment_method := nullif(trim(payment ->> 'method'),'');
    if payment_path is null or payment_method not in ('instapay','vodafone_cash') or payment_path !~ '^pending/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then raise exception 'Invalid payment proof'; end if;
    if not exists (select 1 from storage.objects where bucket_id='payment-proofs' and name=payment_path) then raise exception 'Payment receipt upload is missing'; end if;
  end if;
  if exists (select 1 from public.bookings b join public.customers c on c.id=b.customer_id where c.email=lower(trim(p_email)) and b.trip_id=trip.id and b.scheduled_at=selected_departure_at and b.created_at > now()-interval '5 minutes') then raise exception 'Please wait before submitting the same booking again'; end if;
  insert into public.customers as c(full_name,email,phone,auth_user_id) values(trim(p_full_name),lower(trim(p_email)),nullif(trim(coalesce(p_phone,'')),''),null) on conflict(lower(email)) do update set full_name=excluded.full_name, phone=coalesce(excluded.phone,c.phone), updated_at=now() returning c.id into customer_id;
  total := (trip.price_egp + addons) * p_guest_count;
  insert into public.bookings(customer_id,booking_type,status,trip_id,scheduled_at,guest_count,selections,total_amount,currency,notes,whatsapp_opt_in,whatsapp_opted_in_at) values(customer_id,'trip','pending',trip.id,selected_departure_at,p_guest_count,selections,total,'EGP',nullif(trim(coalesce(p_notes,'')),''),coalesce(p_whatsapp_opt_in,false),case when coalesce(p_whatsapp_opt_in,false) then now() end) returning * into booking;
  insert into public.booking_guests(booking_id,full_name,is_primary) values(booking.id,trim(p_full_name),true);
  if payment_path is not null then insert into public.payments(booking_id,amount,currency,payment_method,status,provider,gateway_status,payment_proof_path,notes) values(booking.id,total,'EGP',payment_method,'pending','manual','pending',payment_path,'Customer receipt awaiting admin verification.'); end if;
  for policy in select * from public.policies where slug=any(required) and is_active loop insert into public.policy_acceptances(policy_id,policy_version,customer_id,booking_id) values(policy.id,policy.version,customer_id,booking.id); end loop;
  return query select booking.id, booking.booking_number;
end;
$$;

create or replace function public.assign_paid_booking_seats(p_payment_token uuid, p_seats integer[])
returns void language plpgsql security definer set search_path = ''
as $$
declare
  booking public.bookings;
  trip public.trips;
  allowed integer[] := array[]::integer[];
  row jsonb;
  value text;
begin
  select * into booking from public.bookings where payment_token=p_payment_token for update;
  if booking.id is null or booking.status='cancelled' then raise exception 'Booking is unavailable'; end if;
  if booking.amount_paid < booking.total_amount then raise exception 'Seat selection unlocks after full payment'; end if;
  select * into trip from public.trips where id=booking.trip_id for update;
  if trip.id is null or not trip.seat_selection_enabled then raise exception 'Seat selection is not enabled for this trip'; end if;
  if coalesce(array_length(p_seats,1),0) <> booking.guest_count or (select count(distinct x) from unnest(p_seats) x) <> booking.guest_count then raise exception 'Choose one different seat for every guest'; end if;
  for row in select value from jsonb_array_elements(coalesce(trip.seat_config #> '{layout,rows}','[]'::jsonb)) loop
    for value in select jsonb_array_elements_text(coalesce(row->'left','[]'::jsonb)) union all select jsonb_array_elements_text(coalesce(row->'right','[]'::jsonb)) loop
      if value ~ '^[0-9]+$' then allowed := array_append(allowed,value::integer); end if;
    end loop;
  end loop;
  if exists(select 1 from unnest(p_seats) seat where not seat=any(allowed)) then raise exception 'Choose an available seat from the map'; end if;
  delete from public.trip_seat_reservations where booking_id=booking.id;
  begin
    insert into public.trip_seat_reservations(trip_id,request_id,booking_id,scheduled_at,seat_number,status,hold_expires_at)
    select trip.id,null,booking.id,booking.scheduled_at,seat,'reserved',null from unnest(p_seats) seat;
  exception when unique_violation then raise exception 'One of those seats was just taken. Please choose again'; end;
  update public.bookings set selections=jsonb_set(coalesce(selections,'{}'::jsonb),'{seats}',to_jsonb(p_seats),true), updated_at=now() where id=booking.id;
end;
$$;

create or replace function private.record_manual_payment(
  p_booking_id uuid, p_amount numeric, p_method text, p_status public.pi_payment_status,
  p_received_at timestamptz default null, p_reference text default null, p_notes text default null
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  payment_id uuid;
begin
  if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'A positive amount is required'; end if;
  if p_method not in ('cash', 'bank_transfer', 'instapay', 'vodafone_cash', 'card_terminal', 'other') then raise exception 'Invalid payment method'; end if;
  if not exists (select 1 from public.bookings where id = p_booking_id) then raise exception 'Booking not found'; end if;

  if p_status = 'recorded' then
    select id into payment_id
    from public.payments
    where booking_id = p_booking_id and amount = p_amount and payment_method = p_method
      and status = 'pending' and payment_proof_path is not null
    order by created_at desc
    limit 1
    for update;
    if payment_id is not null then
      update public.payments
      set status = p_status,
          received_at = coalesce(p_received_at, received_at, now()),
          reference = coalesce(nullif(trim(coalesce(p_reference, '')), ''), reference),
          notes = coalesce(nullif(trim(coalesce(p_notes, '')), ''), notes),
          recorded_by = auth.uid(),
          gateway_status = 'succeeded',
          updated_at = now()
      where id = payment_id;
      return payment_id;
    end if;
  end if;

  insert into public.payments(booking_id, amount, payment_method, status, received_at, reference, notes, recorded_by, provider, gateway_status)
  values (p_booking_id, p_amount, p_method, p_status, coalesce(p_received_at, case when p_status = 'recorded' then now() end), nullif(trim(coalesce(p_reference, '')), ''), nullif(trim(coalesce(p_notes, '')), ''), auth.uid(), 'manual', case when p_status = 'recorded' then 'succeeded' when p_status = 'void' then 'failed' else 'pending' end)
  returning id into payment_id;
  return payment_id;
end;
$$;

revoke all on function private.record_manual_payment(uuid, numeric, text, public.pi_payment_status, timestamptz, text, text) from public, anon, authenticated;
grant execute on function private.record_manual_payment(uuid, numeric, text, public.pi_payment_status, timestamptz, text, text) to authenticated;
