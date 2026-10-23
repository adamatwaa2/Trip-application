create or replace function public.book_spooky_haus(
 p_submission_id uuid, p_email text, p_guests jsonb, p_group_type text,
 p_rules_accepted boolean, p_terms_accepted boolean
) returns table(booking_number text, payment_token uuid, total_egp numeric)
language plpgsql security invoker set search_path = ''
as $$
declare e public.events; b public.bookings; s jsonb; unit_price numeric; n integer;
begin
 if current_user not in ('service_role','postgres') then raise exception 'Not authorized'; end if;
 if p_group_type is null or p_group_type not in ('couple','mixed-group','girls-only') or p_rules_accepted is distinct from true then raise exception 'Accept the admission rules and select your group'; end if;
 if jsonb_typeof(p_guests) is distinct from 'array' then raise exception 'Invalid guest details'; end if;
 n:=jsonb_array_length(p_guests);
 if n not between 1 and 100 or (p_group_type='couple' and n<>2) or (p_group_type='mixed-group' and n<2) then raise exception 'Choose a valid guest quantity for your group'; end if;
 select * into e from public.events where slug='spooky-haus' and is_published for update;
 if e.id is null or e.booking_mode<>'booking' or e.application_required then raise exception 'This event is unavailable for direct booking'; end if;
 select * into b from public.bookings where event_submission_id=p_submission_id;
 if b.id is not null then
  if b.event_id<>e.id or not exists(select 1 from public.customers c where c.id=b.customer_id and c.email=lower(btrim(p_email))) then raise exception 'Booking reference already used'; end if;
  return query select b.booking_number,b.payment_token,b.total_amount; return;
 end if;
 s:=e.media->'priceSchedule';
 unit_price:=case when s is not null then case when now() < (s->>'changesAt')::timestamptz then (s->>'before')::numeric else (s->>'after')::numeric end else e.price_egp end;
 if unit_price is null or unit_price<=0 then raise exception 'Event price is unavailable'; end if;
 perform private.legacy_event_booking(e.id,p_submission_id,p_email,p_guests,'paymob',null,p_terms_accepted);
 select * into b from public.bookings where event_submission_id=p_submission_id;
 update public.bookings set total_amount=(unit_price+e.booking_fee_egp)*n,
 selections=selections || jsonb_build_object('unitPriceEgp',unit_price,'ticketSubtotalEgp',unit_price*n,'totalEgp',(unit_price+e.booking_fee_egp)*n,'groupType',p_group_type,'admissionRulesAccepted',true,'admissionRules','18+; couples, mixed groups or girls-only; costumes mandatory; no alcohol; no drugs','pricedAt',now())
 where id=b.id returning * into b;
 return query select b.booking_number,b.payment_token,b.total_amount;
end;
$$;
revoke all on function public.book_spooky_haus(uuid,text,jsonb,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.book_spooky_haus(uuid,text,jsonb,text,boolean,boolean) to service_role;
