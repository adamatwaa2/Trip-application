-- Paid trip extras are priced by the catalogue, never by values posted by a browser.

alter table public.trips
  add column if not exists song_request_enabled boolean not null default false;

create or replace function private.trip_booking_addons(p_fields jsonb, p_answers jsonb)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
  field jsonb;
  option jsonb;
  answer jsonb;
  total numeric := 0;
begin
  if jsonb_typeof(coalesce(p_fields, '[]'::jsonb)) <> 'array' or jsonb_typeof(coalesce(p_answers, '{}'::jsonb)) <> 'object' then
    raise exception 'Invalid custom booking answers';
  end if;
  for field in select value from jsonb_array_elements(p_fields)
  loop
    answer := p_answers -> (field ->> 'id');
    if coalesce((field ->> 'required')::boolean, false)
       and (answer is null or answer = 'null'::jsonb or (jsonb_typeof(answer) = 'string' and btrim(answer #>> '{}') = '') or (jsonb_typeof(answer) = 'array' and jsonb_array_length(answer) = 0)) then
      raise exception 'A required trip question is missing';
    end if;
    for option in select value from jsonb_array_elements(coalesce(field -> 'options', '[]'::jsonb))
    loop
      if jsonb_typeof(option) = 'object' and coalesce((option ->> 'priceEgp')::numeric, 0) > 0
        and ((jsonb_typeof(answer) = 'string' and answer #>> '{}' = option ->> 'id')
          or (jsonb_typeof(answer) = 'array' and exists (select 1 from jsonb_array_elements_text(answer) value where value = option ->> 'id')))
      then
        total := total + (option ->> 'priceEgp')::numeric;
      end if;
    end loop;
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
  selections jsonb := coalesce(p_selections, '{}'::jsonb) - 'seats';
  payment jsonb;
  payment_path text;
  payment_method text;
  addons numeric := 0;
  total numeric;
  policy public.policies;
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
  if trip.capacity is not null and (select coalesce(sum(guest_count),0) from public.bookings where trip_id=trip.id and status in ('pending','confirmed')) + p_guest_count > trip.capacity then raise exception 'This trip does not have enough availability'; end if;
  addons := private.trip_booking_addons(coalesce(trip.booking_form_fields,'[]'::jsonb), answers);
  payment := selections -> 'paymentProof';
  if trip.payment_proof_required and (payment is null or jsonb_typeof(payment) <> 'object') then raise exception 'Payment proof is required for this trip'; end if;
  if payment is not null then
    payment_path := nullif(trim(payment ->> 'path'),''); payment_method := nullif(trim(payment ->> 'method'),'');
    if payment_path is null or payment_method not in ('instapay','vodafone_cash') or payment_path !~ '^pending/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then raise exception 'Invalid payment proof'; end if;
    if not exists (select 1 from storage.objects where bucket_id='payment-proofs' and name=payment_path) then raise exception 'Payment receipt upload is missing'; end if;
  end if;
  if exists (select 1 from public.bookings b join public.customers c on c.id=b.customer_id where c.email=lower(trim(p_email)) and b.trip_id=trip.id and b.created_at > now()-interval '5 minutes') then raise exception 'Please wait before submitting the same booking again'; end if;
  insert into public.customers as c(full_name,email,phone,auth_user_id) values(trim(p_full_name),lower(trim(p_email)),nullif(trim(coalesce(p_phone,'')),''),null) on conflict(lower(email)) do update set full_name=excluded.full_name, phone=coalesce(excluded.phone,c.phone), updated_at=now() returning c.id into customer_id;
  total := (trip.price_egp + addons) * p_guest_count;
  insert into public.bookings(customer_id,booking_type,status,trip_id,scheduled_at,guest_count,selections,total_amount,currency,notes,whatsapp_opt_in,whatsapp_opted_in_at) values(customer_id,'trip','pending',trip.id,trip.departure_at,p_guest_count,selections,total,'EGP',nullif(trim(coalesce(p_notes,'')),''),coalesce(p_whatsapp_opt_in,false),case when coalesce(p_whatsapp_opt_in,false) then now() end) returning * into booking;
  insert into public.booking_guests(booking_id,full_name,is_primary) values(booking.id,trim(p_full_name),true);
  if payment_path is not null then insert into public.payments(booking_id,amount,currency,payment_method,status,provider,gateway_status,payment_proof_path,notes) values(booking.id,total,'EGP',payment_method,'pending','manual','pending',payment_path,'Customer receipt awaiting admin verification.'); end if;
  for policy in select * from public.policies where slug=any(required) and is_active loop insert into public.policy_acceptances(policy_id,policy_version,customer_id,booking_id) values(policy.id,policy.version,customer_id,booking.id); end loop;
  return query select booking.id, booking.booking_number;
end;
$$;

-- Called only by the server after payment. No unpaid booking can reserve a seat.
create or replace function public.assign_paid_booking_seats(p_payment_token uuid, p_seats integer[])
returns void language plpgsql security definer set search_path = '' as $$
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
    insert into public.trip_seat_reservations(trip_id,request_id,booking_id,seat_number,status,hold_expires_at)
    select trip.id,null,booking.id,seat,'reserved',null from unnest(p_seats) seat;
  exception when unique_violation then raise exception 'One of those seats was just taken. Please choose again'; end;
  update public.bookings set selections=jsonb_set(coalesce(selections,'{}'::jsonb),'{seats}',to_jsonb(p_seats),true), updated_at=now() where id=booking.id;
end;
$$;

revoke all on function public.assign_paid_booking_seats(uuid, integer[]) from public, anon, authenticated;
grant execute on function public.assign_paid_booking_seats(uuid, integer[]) to service_role;
