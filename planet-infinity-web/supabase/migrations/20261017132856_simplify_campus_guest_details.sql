-- Owner requested removal of birth date and gender collection. No historical data is deleted.
create or replace function public.submit_campus_event_booking(p_quote_id uuid,p_session_id uuid,p_submission_id uuid,p_email text,p_guests jsonb,p_payment_method text,p_payment_proof jsonb,p_terms_accepted boolean)
returns table(booking_number text,payment_token uuid) language plpgsql set search_path='' as $$
declare q public.event_price_quotes; b public.bookings; e public.events; receipt text; method text;
begin
 if current_user not in ('service_role','postgres') then raise exception 'Not authorized'; end if;
 select event_id into q.event_id from public.event_price_quotes where id=p_quote_id and session_id=p_session_id;
 if q.event_id is null then raise exception 'Your price reservation is unavailable. Refresh your total'; end if;
 select * into e from public.events where id=q.event_id for update;
 select * into q from public.event_price_quotes where id=p_quote_id and session_id=p_session_id for update;
 if q.booking_id is not null then
  select * into b from public.bookings where id=q.booking_id;
  if not exists(select 1 from public.customers where id=b.customer_id and email=lower(btrim(p_email))) then raise exception 'Booking reference already used'; end if;
  return query select b.booking_number,b.payment_token; return;
 end if;
 if q.expires_at<=now() then raise exception 'Your price reservation expired. Refresh your total before paying'; end if;
 if not e.is_published then raise exception 'This event is unavailable'; end if;
 if e.capacity is not null and e.capacity < (select coalesce(sum(guest_count),0) from public.bookings where event_id=e.id and status in ('pending','confirmed'))+(select coalesce(sum(quantity),0) from public.event_price_quotes where event_id=e.id and booking_id is null and expires_at>now()) then raise exception 'Not enough event capacity remains'; end if;
 if q.ambassador_id is not null and not exists(select 1 from public.campus_ambassadors a join public.ambassador_codes c on c.ambassador_id=a.id where a.id=q.ambassador_id and a.is_active and c.code=q.code and c.is_active) then raise exception 'This ambassador code is inactive'; end if;
 if jsonb_typeof(p_guests) is distinct from 'array' or jsonb_array_length(p_guests)<>q.quantity then raise exception 'Guest quantity does not match your reserved tickets'; end if;
 -- Admission is acknowledged through the event policy; do not collect birth date or gender.
 select jsonb_agg(jsonb_build_object('name',value->>'name','phone',value->>'phone')) into p_guests from jsonb_array_elements(p_guests);
 if p_payment_method not in ('manual','paymob') or p_payment_method is null then raise exception 'Invalid payment method'; end if;
 if p_payment_method='manual' then
  receipt:=p_payment_proof->>'path'; method:=p_payment_proof->>'method';
  if method is null or method not in ('instapay','vodafone_cash') or receipt is null or receipt !~ '^pending/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then raise exception 'A valid payment receipt is required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(receipt,0));
  if exists(select 1 from public.payments where payment_proof_path=receipt) then raise exception 'This receipt is already linked to a booking'; end if;
  if not exists(select 1 from storage.objects where bucket_id='payment-proofs' and name=receipt) then raise exception 'Payment receipt upload is missing'; end if;
 end if;
 perform private.legacy_event_booking(e.id,p_submission_id,p_email,p_guests,'paymob',null,p_terms_accepted);
 select * into b from public.bookings where event_submission_id=p_submission_id;
 if b.event_quote_id is not null and b.event_quote_id<>q.id then raise exception 'Booking reference already used'; end if;
 update public.bookings set total_amount=(q.snapshot->>'total')::numeric, ambassador_id=q.ambassador_id,ambassador_code=q.code,event_quote_id=q.id,
 selections=selections || jsonb_build_object('unitPrices',q.snapshot->'unitPrices','priceLines',q.snapshot->'lines','originalSubtotalEgp',q.snapshot->'originalSubtotal','discountPercent',q.snapshot->'discountPercent','discountEgp',q.snapshot->'discountEgp','ticketSubtotalEgp',(q.snapshot->>'originalSubtotal')::numeric-(q.snapshot->>'discountEgp')::numeric,'bookingFeesEgp',q.snapshot->'fees','totalEgp',q.snapshot->'total','commissionTiers',q.snapshot->'commissionTiers','ambassadorCode',q.code,'universityAdmission',q.ambassador_id is not null,'preferredPaymentMethod',p_payment_method)
 where id=b.id;
 update public.event_price_quotes set booking_id=b.id where id=q.id;
 if p_payment_method='manual' then
  insert into public.payments(booking_id,amount,currency,payment_method,status,provider,gateway_status,payment_proof_path,notes)
  values(b.id,(q.snapshot->>'total')::numeric,'EGP',method,'pending','manual','pending',receipt,'Event transfer receipt awaiting verification.');
 end if;
 return query select b.booking_number,b.payment_token;
end $$;
revoke all on function public.submit_campus_event_booking(uuid,uuid,uuid,text,jsonb,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.submit_campus_event_booking(uuid,uuid,uuid,text,jsonb,text,jsonb,boolean) to service_role;
