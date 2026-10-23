
-- Reuse the existing, admin-managed Halloween promo codes for Spooky Haus only.
-- These are discount rules, not an instruction to move or create ambassador payouts.
create or replace function public.price_spooky_haus(p_quantity integer, p_code text default null)
returns jsonb language plpgsql stable security invoker set search_path=''
as $function$
declare e public.events; s jsonb; unit_price numeric; fee numeric; discount numeric:=0;
 source_id uuid; tiers jsonb; v_code text:=nullif(upper(btrim(p_code)),''); subtotal numeric; saving numeric;
begin
 if current_user not in ('service_role','postgres') then raise exception 'Not authorized'; end if;
 if p_quantity is null or p_quantity not between 1 and 100 then raise exception 'Choose a valid ticket quantity'; end if;
 select * into e from public.events where slug='spooky-haus' and is_published;
 if e.id is null or e.booking_mode<>'booking' or e.application_required then raise exception 'This event is unavailable'; end if;
 if v_code is not null then
  if v_code !~ '^[A-Z0-9-]{3,24}$' then raise exception 'Promo code is invalid or inactive'; end if;
  select id into source_id from public.events where slug='halloween-party-2026';
  select r.discount_tiers into tiers
  from public.ambassador_codes c
  join public.campus_ambassadors a on a.id=c.ambassador_id and a.event_id=c.event_id
  join public.event_sales_rules r on r.event_id=c.event_id
  where c.event_id=source_id and c.code=v_code and c.is_active and a.is_active;
  if tiers is null then raise exception 'Promo code is invalid or inactive'; end if;
  discount:=coalesce(private.tier_value(tiers,p_quantity,'percent'),0);
  if discount<0 or discount>100 then raise exception 'Promo discount is unavailable'; end if;
 end if;
 s:=e.media->'priceSchedule';
 unit_price:=case when s is not null then case when now() < (s->>'changesAt')::timestamptz then (s->>'before')::numeric else (s->>'after')::numeric end else e.price_egp end;
 if unit_price is null or unit_price<=0 then raise exception 'Event price is unavailable'; end if;
 fee:=coalesce(e.booking_fee_egp,0);
 subtotal:=unit_price*p_quantity; saving:=round(subtotal*discount/100,2);
 return jsonb_build_object('quantity',p_quantity,'code',v_code,'unitPrice',unit_price,'originalSubtotal',subtotal,'discountPercent',discount,'discountEgp',saving,'feePerTicket',fee,'fees',fee*p_quantity,'total',subtotal-saving+fee*p_quantity);
end;
$function$;
revoke all on function public.price_spooky_haus(integer,text) from public,anon,authenticated;
grant execute on function public.price_spooky_haus(integer,text) to service_role;

-- Keep the original endpoint working for already-open checkouts.
create or replace function public.book_spooky_haus_with_promo(
 p_submission_id uuid,p_email text,p_guests jsonb,p_group_type text,
 p_rules_accepted boolean,p_terms_accepted boolean,p_code text default null)
returns table(booking_number text,payment_token uuid,total_egp numeric)
language plpgsql security invoker set search_path=''
as $function$
declare e public.events; b public.bookings; quote jsonb; n integer;
begin
 if current_user not in ('service_role','postgres') then raise exception 'Not authorized'; end if;
 if jsonb_typeof(p_guests) is distinct from 'array' then raise exception 'Invalid guest details'; end if;
 n:=jsonb_array_length(p_guests);
 select * into e from public.events where slug='spooky-haus' and is_published for update;
 if e.id is null then raise exception 'This event is unavailable'; end if;
 -- The original function verifies submission ownership and preserves its original price.
 if exists(select 1 from public.bookings where event_submission_id=p_submission_id) then
  return query select * from public.book_spooky_haus(p_submission_id,p_email,p_guests,p_group_type,p_rules_accepted,p_terms_accepted);
  return;
 end if;
 quote:=public.price_spooky_haus(n,p_code);
 perform public.book_spooky_haus(p_submission_id,p_email,p_guests,p_group_type,p_rules_accepted,p_terms_accepted);
 select * into b from public.bookings where event_submission_id=p_submission_id and event_id=e.id;
 update public.bookings set total_amount=(quote->>'total')::numeric,
 selections=selections || jsonb_build_object(
  'promoCode',quote->>'code','promoSourceEventSlug',case when quote->>'code' is not null then 'halloween-party-2026' else null end,
  'originalSubtotal',(quote->>'originalSubtotal')::numeric,'discountPercent',(quote->>'discountPercent')::numeric,
  'discountEgp',(quote->>'discountEgp')::numeric,'bookingFeePerTicketEgp',(quote->>'feePerTicket')::numeric,
  'bookingFeesEgp',(quote->>'fees')::numeric,'totalEgp',(quote->>'total')::numeric)
 where id=b.id returning * into b;
 return query select b.booking_number,b.payment_token,b.total_amount;
end;
$function$;
revoke all on function public.book_spooky_haus_with_promo(uuid,text,jsonb,text,boolean,boolean,text) from public,anon,authenticated;
grant execute on function public.book_spooky_haus_with_promo(uuid,text,jsonb,text,boolean,boolean,text) to service_role;
