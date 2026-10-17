-- FOFA promotional group checkout. The original checkout RPC remains unchanged.
create or replace function public.submit_public_event_booking_fofa(
 p_event_id uuid,p_submission_id uuid,p_email text,p_guests jsonb,
 p_payment_method text,p_payment_proof jsonb,p_terms_accepted boolean,p_promo_code text
) returns table(booking_number text,payment_token uuid)
language plpgsql security invoker set search_path = '' as $$
declare
 v_event public.events;
 v_booking public.bookings;
 v_customer uuid;
 v_guest jsonb;
 v_count integer;
 v_total numeric;
 v_booked integer;
 v_method text;
 v_path text;
 v_index integer := 0;
 v_policy public.policies;
 v_discount_rate numeric := 0;
 v_ticket_subtotal numeric;
begin
 if current_user not in ('service_role','postgres') then raise exception 'Not authorized'; end if;
 if p_submission_id is null or p_terms_accepted is distinct from true then raise exception 'Event policies must be accepted'; end if;
 if coalesce(p_email,'') !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' or char_length(p_email)>254 then raise exception 'Invalid booking email'; end if;
 if jsonb_typeof(p_guests) is distinct from 'array' then raise exception 'Invalid guest details'; end if;
 v_count:=jsonb_array_length(p_guests);
 if v_count<1 then raise exception 'At least one guest is required'; end if;
 if p_payment_method not in ('manual','paymob') or p_payment_method is null then raise exception 'Invalid payment method'; end if;
 if upper(btrim(coalesce(p_promo_code,''))) <> 'FOFA' or v_count < 5 then raise exception 'FOFA requires at least 5 tickets in one booking'; end if;
 for v_guest in select value from jsonb_array_elements(p_guests) loop
  if jsonb_typeof(v_guest) <> 'object' or char_length(btrim(coalesce(v_guest->>'name',''))) not between 2 and 120 or char_length(btrim(coalesce(v_guest->>'phone',''))) not between 6 and 40 then raise exception 'Invalid guest name or phone'; end if;
 end loop;
 -- Serialize retry and capacity checks on this event.
 select * into v_event from public.events where id=p_event_id and is_published for update;
 if v_event.id is null then raise exception 'This event is unavailable'; end if;
 select b.* into v_booking from public.bookings b where b.event_submission_id=p_submission_id;
 if v_booking.id is not null then
  if v_booking.event_id<>p_event_id or not exists(select 1 from public.customers c where c.id=v_booking.customer_id and c.email=lower(btrim(p_email))) then raise exception 'Booking reference already used'; end if;
  return query select v_booking.booking_number,v_booking.payment_token; return;
 end if;
 if v_event.booking_mode<>'booking' or v_event.application_required then raise exception 'This event is unavailable for direct booking'; end if;
 if v_event.price_egp is null or v_event.price_egp<=0 then raise exception 'Event price is unavailable'; end if;
 if exists(select 1 from (values('events-payment'),('privacy')) required(slug) left join public.policies p on p.slug=required.slug where p.id is null or not p.is_active or btrim(p.body)='') then raise exception 'Event policies are unavailable'; end if;
 select coalesce(sum(b.guest_count),0) into v_booked from public.bookings b where b.event_id=p_event_id and b.status in ('pending','confirmed');
 if v_event.capacity is not null and v_booked+v_count>v_event.capacity then raise exception 'Not enough event capacity remains'; end if;
 if v_event.slug <> 'halloween-party-2026' then raise exception 'FOFA is valid for Halloween only'; end if;
 v_discount_rate:=case when v_count>=15 then 0.40 when v_count>=10 then 0.25 else 0.10 end;
 v_ticket_subtotal:=round(v_event.price_egp*v_count*(1-v_discount_rate),2);
 v_total:=v_ticket_subtotal+v_event.booking_fee_egp*v_count;
 if v_total>9999999999.99 then raise exception 'Booking total exceeds the supported amount'; end if;
 if exists(select 1 from public.bookings b join public.customers c on c.id=b.customer_id where b.event_id=p_event_id and c.email=lower(btrim(p_email)) and b.status<>'cancelled' and b.created_at>now()-interval '2 minutes') then raise exception 'A booking was already received. Please wait before submitting again'; end if;
 if p_payment_method='manual' then
  v_method:=p_payment_proof->>'method';v_path:=p_payment_proof->>'path';
  if v_method is null or v_method not in ('instapay','vodafone_cash') or v_path is null or v_path !~ '^pending/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then raise exception 'A valid payment receipt is required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_path,0));
  if exists(select 1 from public.payments p where p.payment_proof_path=v_path) then raise exception 'This receipt is already linked to a booking'; end if;
  if not exists(select 1 from storage.objects o where o.bucket_id='payment-proofs' and o.name=v_path) then raise exception 'Payment receipt upload is missing'; end if;
 end if;
 insert into public.customers as c(full_name,email,phone) values(btrim(p_guests->0->>'name'),lower(btrim(p_email)),btrim(p_guests->0->>'phone'))
 on conflict(lower(email)) do update set full_name=excluded.full_name,phone=excluded.phone,updated_at=now() returning c.id into v_customer;
 insert into public.bookings(customer_id,booking_type,event_id,status,scheduled_at,guest_count,total_amount,currency,event_submission_id,selections)
 values(v_customer,'event',p_event_id,'pending',v_event.starts_at,v_count,v_total,'EGP',p_submission_id,
 jsonb_build_object('guestRoster',p_guests,'ticketLabel',v_event.ticket_label,'unitPriceEgp',v_event.price_egp, 'promoCode','FOFA','discountPercent',v_discount_rate*100,'discountEgp',v_event.price_egp*v_count-v_ticket_subtotal,'bookingFeePerTicketEgp',v_event.booking_fee_egp,'ticketSubtotalEgp',v_ticket_subtotal,'bookingFeesEgp',v_event.booking_fee_egp*v_count,'totalEgp',v_total,'preferredPaymentMethod',p_payment_method)) returning * into v_booking;
 for v_guest in select value from jsonb_array_elements(p_guests) loop
  insert into public.booking_guests(booking_id,full_name,phone,is_primary) values(v_booking.id,btrim(v_guest->>'name'),btrim(v_guest->>'phone'),v_index=0);v_index:=v_index+1;
 end loop;
 if p_payment_method='manual' then
  insert into public.payments(booking_id,amount,currency,payment_method,status,provider,gateway_status,payment_proof_path,notes)
  values(v_booking.id,v_total,'EGP',v_method,'pending','manual','pending',v_path,'Event transfer receipt awaiting verification.');
 end if;
 for v_policy in select * from public.policies where slug in ('events-payment','privacy') and is_active loop
  insert into public.policy_acceptances(policy_id,policy_version,customer_id,booking_id) values(v_policy.id,v_policy.version,v_customer,v_booking.id);
 end loop;
 return query select v_booking.booking_number,v_booking.payment_token;
end;$$;
revoke all on function public.submit_public_event_booking_fofa(uuid,uuid,text,jsonb,text,jsonb,boolean,text) from public,anon,authenticated;
grant execute on function public.submit_public_event_booking_fofa(uuid,uuid,text,jsonb,text,jsonb,boolean,text) to service_role;
-- Superseded by campus_ambassadors_and_ticket_tiers. Keep the historical
-- definition for migration continuity, but never expose the retired writer.
revoke all on function public.submit_public_event_booking_fofa(uuid,uuid,text,jsonb,text,jsonb,boolean,text) from service_role;
