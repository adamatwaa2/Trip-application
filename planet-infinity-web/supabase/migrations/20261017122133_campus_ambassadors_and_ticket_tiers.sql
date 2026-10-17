-- Prices and commission rules are snapshotted; only server RPCs allocate inventory.
create table public.event_sales_rules (
 event_id uuid primary key references public.events(id),
 price_tiers jsonb not null,
 discount_tiers jsonb not null,
 commission_tiers jsonb not null,
 updated_at timestamptz not null default now()
);
create table public.campus_ambassadors (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id),
 name text not null check(char_length(name) between 2 and 120), university text not null default '',
 email text not null default '', phone text not null default '', is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.ambassador_codes (
 id uuid primary key default gen_random_uuid(), ambassador_id uuid not null references public.campus_ambassadors(id),
 event_id uuid not null references public.events(id), code text not null check(code ~ '^[A-Z0-9-]{3,24}$'),
 is_active boolean not null default true, unique(event_id,code)
);
create table public.event_price_quotes (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id),
 session_id uuid not null, quantity integer not null check(quantity between 1 and 500),
 ambassador_id uuid references public.campus_ambassadors(id), code text,
 snapshot jsonb not null, expires_at timestamptz not null default now()+interval '20 minutes',
 booking_id uuid unique references public.bookings(id), created_at timestamptz not null default now()
);
create index event_quotes_inventory on public.event_price_quotes(event_id,expires_at) where booking_id is null;
create index event_quotes_session on public.event_price_quotes(event_id,session_id);
alter table public.bookings add column ambassador_id uuid references public.campus_ambassadors(id),
 add column ambassador_code text, add column event_quote_id uuid unique references public.event_price_quotes(id),
 add column complimentary_ambassador_id uuid unique references public.campus_ambassadors(id);
create index bookings_ambassador on public.bookings(ambassador_id) where ambassador_id is not null;
create table public.ambassador_commissions (
 booking_id uuid not null references public.bookings(id), ticket_index integer not null,
 ambassador_id uuid not null references public.campus_ambassadors(id),
 confirmed_position integer not null, original_price numeric(12,2) not null,
 rate numeric(5,2) not null, amount numeric(12,2) not null,
 is_void boolean not null default false, confirmed_at timestamptz not null default now(),
 primary key(booking_id,ticket_index)
);
create index ambassador_commissions_active on public.ambassador_commissions(ambassador_id,is_void);
create table public.campus_audit_log (
 id bigint generated always as identity primary key, actor_id uuid, action text not null,
 record_id text, details jsonb not null, created_at timestamptz not null default now()
);
do $$ declare t text; begin
 foreach t in array array['event_sales_rules','campus_ambassadors','ambassador_codes','event_price_quotes','ambassador_commissions','campus_audit_log'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy campus_admin_read on public.%I for select to authenticated using ((select private.is_pi_admin()))',t);
 end loop;
end $$;

create function private.validate_sales_rules() returns trigger language plpgsql set search_path='' as $$
declare tiers jsonb; tier jsonb; prev integer; n integer; val numeric; k text;
begin
 foreach k in array array['price_tiers','discount_tiers','commission_tiers'] loop
  tiers:=to_jsonb(new)->k; prev:=0;
  if jsonb_typeof(tiers)<>'array' or jsonb_array_length(tiers) not between 1 and 30 then raise exception 'Invalid tier rules'; end if;
  for tier in select value from jsonb_array_elements(tiers) loop
   n:=(tier->>'from')::integer;
   val:=(tier->>case when k='price_tiers' then 'price' else 'percent' end)::numeric;
   if n is null or n<=prev or (prev=0 and n<>1) or val is null or val<0 or (k='price_tiers' and (val<=0 or val>1000000)) or (k<>'price_tiers' and val>100) or val<>round(val,2) then raise exception 'Invalid tier rules'; end if;
   prev:=n;
  end loop;
 end loop;
 new.updated_at:=now(); return new;
end $$;
create trigger validate_event_sales_rules before insert or update on public.event_sales_rules for each row execute function private.validate_sales_rules();
insert into public.event_sales_rules(event_id,price_tiers,discount_tiers,commission_tiers)
select id,'[{"from":1,"price":1000},{"from":51,"price":1200},{"from":101,"price":1300},{"from":121,"price":1400},{"from":151,"price":1500},{"from":201,"price":1700},{"from":221,"price":1800},{"from":251,"price":2000}]',
'[{"from":1,"percent":5},{"from":5,"percent":10},{"from":10,"percent":20},{"from":15,"percent":30}]',
'[{"from":1,"percent":5},{"from":10,"percent":7.5},{"from":15,"percent":10},{"from":20,"percent":12.5},{"from":25,"percent":15}]'
from public.events where slug='halloween-party-2026';

create function private.tier_value(tiers jsonb, p_position integer, field text) returns numeric
language sql immutable set search_path='' as $$
 select (value->>field)::numeric from jsonb_array_elements(tiers)
 where (value->>'from')::integer<=p_position order by (value->>'from')::integer desc limit 1;
$$;

-- Same row lock is used for quoting, checkout and complimentary inventory.
create function public.reserve_event_quote(p_event_id uuid,p_session_id uuid,p_quantity integer,p_code text default null)
returns jsonb language plpgsql set search_path='' as $$
declare e public.events; r public.event_sales_rules; a uuid; q public.event_price_quotes;
 occupied integer; paid_slots integer; subtotal numeric; discount numeric:=0; fees numeric; prices jsonb; lines jsonb; result jsonb; v_code text:=nullif(upper(btrim(p_code)),'');
begin
 if current_user not in ('service_role','postgres') then raise exception 'Not authorized'; end if;
 if p_session_id is null or p_quantity is null or p_quantity not between 1 and 500 then raise exception 'Choose between 1 and 500 tickets'; end if;
 select * into e from public.events where id=p_event_id and is_published for update;
 if e.id is null or e.booking_mode<>'booking' or e.application_required then raise exception 'This event is unavailable'; end if;
 select * into r from public.event_sales_rules where event_id=e.id;
 if r.event_id is null then raise exception 'Event price rules are unavailable'; end if;
 if v_code is not null then
  select c.ambassador_id into a from public.ambassador_codes c join public.campus_ambassadors am on am.id=c.ambassador_id
  where c.event_id=e.id and am.event_id=e.id and c.code=v_code and c.is_active and am.is_active;
  if a is null then raise exception 'This ambassador code is invalid or inactive'; end if;
 end if;
 select * into q from public.event_price_quotes where event_id=e.id and session_id=p_session_id and booking_id is null and expires_at>now() order by created_at desc limit 1;
 if q.id is not null and q.quantity=p_quantity and q.code is not distinct from v_code then return q.snapshot || jsonb_build_object('id',q.id,'expiresAt',q.expires_at); end if;
 update public.event_price_quotes set expires_at=now() where event_id=e.id and session_id=p_session_id and booking_id is null and expires_at>now();
 select coalesce(sum(guest_count),0),coalesce(sum(case when complimentary_ambassador_id is null then guest_count else 0 end),0)
 into occupied,paid_slots from public.bookings where event_id=e.id and status in ('pending','confirmed');
 select occupied+coalesce(sum(quantity),0),paid_slots+coalesce(sum(quantity),0) into occupied,paid_slots from public.event_price_quotes where event_id=e.id and booking_id is null and expires_at>now();
 if e.capacity is not null and occupied+p_quantity>e.capacity then raise exception 'Not enough event capacity remains'; end if;
 select jsonb_agg(price order by i),sum(price) into prices,subtotal from
 (select i,private.tier_value(r.price_tiers,paid_slots+i,'price') as price from generate_series(1,p_quantity) i) s;
 select jsonb_agg(jsonb_build_object('quantity',n,'price',price) order by price) into lines from
 (select value::numeric price,count(*) n from jsonb_array_elements_text(prices) group by value) s;
 if a is not null then discount:=private.tier_value(r.discount_tiers,p_quantity,'percent'); end if;
 fees:=e.booking_fee_egp*p_quantity;
 result:=jsonb_build_object('quantity',p_quantity,'code',v_code,'unitPrices',prices,'lines',lines,'originalSubtotal',subtotal,'discountPercent',discount,'discountEgp',round(subtotal*discount/100,2),'fees',fees,'total',subtotal-round(subtotal*discount/100,2)+fees,'discountTiers',r.discount_tiers,'commissionTiers',r.commission_tiers,'universityAdmission',a is not null);
 insert into public.event_price_quotes(event_id,session_id,quantity,ambassador_id,code,snapshot) values(e.id,p_session_id,p_quantity,a,v_code,result) returning * into q;
 return result || jsonb_build_object('id',q.id,'expiresAt',q.expires_at);
end $$;
revoke all on function public.reserve_event_quote(uuid,uuid,integer,text) from public,anon,authenticated;
grant execute on function public.reserve_event_quote(uuid,uuid,integer,text) to service_role;

-- Retain the existing atomic guest/policy writer privately. Its fixed price is
-- replaced inside the same transaction before any payment can be created.
do $$ begin
 execute replace(pg_get_functiondef('public.submit_public_event_booking(uuid,uuid,text,jsonb,text,jsonb,boolean)'::regprocedure),'public.submit_public_event_booking(', 'private.legacy_event_booking(');
end $$;
revoke all on function private.legacy_event_booking(uuid,uuid,text,jsonb,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function private.legacy_event_booking(uuid,uuid,text,jsonb,text,jsonb,boolean) to service_role;
create function public.submit_campus_event_booking(p_quote_id uuid,p_session_id uuid,p_submission_id uuid,p_email text,p_guests jsonb,p_payment_method text,p_payment_proof jsonb,p_terms_accepted boolean)
returns table(booking_number text,payment_token uuid) language plpgsql set search_path='' as $$
declare q public.event_price_quotes; b public.bookings; g jsonb; men integer:=0; women integer:=0; min_age integer; age integer; birth date; e public.events; receipt text; method text;
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
 for g in select value from jsonb_array_elements(p_guests) loop
  if g->>'gender' not in ('man','woman') or g->>'gender' is null then raise exception 'Select each guest gender'; end if;
  begin birth:=(g->>'dateOfBirth')::date; exception when others then raise exception 'Enter each guest date of birth'; end;
  if birth is null or birth>e.starts_at::date or birth<date '1900-01-01' then raise exception 'Enter a valid date of birth'; end if;
  age:=extract(year from age(e.starts_at::date,birth));
  min_age:=case when q.ambassador_id is not null or g->>'gender'='woman' then 18 else 21 end;
  if age<min_age then raise exception 'A guest does not meet the admission age requirement'; end if;
  if g->>'gender'='man' then men:=men+1; else women:=women+1; end if;
 end loop;
 if q.ambassador_id is not null and men>0 and men<>women then raise exception 'University bookings require mixed groups 50:50, couples or girls-only. Contact your ambassador to join a group'; end if;
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
-- The old RPC is retired in the release migration after the new checkout is live.
do $$ begin
 if to_regprocedure('public.submit_public_event_booking_fofa(uuid,uuid,text,jsonb,text,jsonb,boolean,text)') is not null then
  revoke all on function public.submit_public_event_booking_fofa(uuid,uuid,text,jsonb,text,jsonb,boolean,text) from public,anon,authenticated,service_role;
 end if;
end $$;

create function private.accrue_ambassador_commission() returns trigger language plpgsql security definer set search_path='' as $$
declare n integer; i integer; price numeric; rate numeric;
begin
 if new.ambassador_id is null then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended(new.ambassador_id::text,17));
 if new.status='cancelled' then
  update public.ambassador_commissions set is_void=true where booking_id=new.id;
 elsif new.status='confirmed' and new.amount_paid>=new.total_amount and new.total_amount>0 then
  if exists(select 1 from public.ambassador_commissions where booking_id=new.id) then
   update public.ambassador_commissions set is_void=false where booking_id=new.id;
  else
   select count(*) into n from public.ambassador_commissions where ambassador_id=new.ambassador_id and not is_void;
   for i in 1..new.guest_count loop
    price:=(new.selections->'unitPrices'->>(i-1))::numeric;
    rate:=private.tier_value(new.selections->'commissionTiers',n+i,'percent');
    if price is null or rate is null then raise exception 'Commission price snapshot is missing'; end if;
    insert into public.ambassador_commissions(booking_id,ticket_index,ambassador_id,confirmed_position,original_price,rate,amount)
    values(new.id,i,new.ambassador_id,n+i,price,rate,round(price*rate/100,2));
   end loop;
  end if;
 else
  update public.ambassador_commissions set is_void=true where booking_id=new.id;
 end if;
 return new;
end $$;
create trigger zz_accrue_ambassador_commission after insert or update of status,amount_paid on public.bookings for each row execute function private.accrue_ambassador_commission();

-- Admin operations are authorized in the database as well as the application.
create function private.save_campus_ambassador(p_id uuid,p_event_id uuid,p_name text,p_university text,p_email text,p_phone text,p_code text,p_active boolean,p_prefix text default 'CAMPUS')
returns uuid language plpgsql security definer set search_path='' as $$
declare a uuid; normalized text:=nullif(upper(btrim(p_code)),''); prefix text:=upper(btrim(p_prefix)); suffix text; i integer;
begin
 if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
 perform 1 from public.events where id=p_event_id for update;
 if normalized is null then
  if prefix is null or prefix !~ '^[A-Z]{2,10}$' then raise exception 'Use a short group prefix such as FOFA or AUC'; end if;
  for i in 1..702 loop
   suffix:=case when i<=26 then chr(64+i) else chr(65+(i-27)/26)||chr(65+(i-27)%26) end;
   if not exists(select 1 from public.ambassador_codes where event_id=p_event_id and code=prefix||'-'||suffix) then normalized:=prefix||'-'||suffix; exit; end if;
  end loop;
  if normalized is null then raise exception 'This prefix has no unused codes. Choose another short prefix'; end if;
 end if;
 if normalized !~ '^[A-Z0-9-]{3,24}$' then raise exception 'Use a valid ambassador code'; end if;
 if p_id is null then
  insert into public.campus_ambassadors(event_id,name,university,email,phone,is_active) values(p_event_id,btrim(p_name),btrim(p_university),lower(btrim(p_email)),btrim(p_phone),p_active) returning id into a;
 else
  update public.campus_ambassadors set name=btrim(p_name),university=btrim(p_university),email=lower(btrim(p_email)),phone=btrim(p_phone),is_active=p_active where id=p_id and event_id=p_event_id returning id into a;
  if a is null then raise exception 'Ambassador not found'; end if;
 end if;
 if exists(select 1 from public.ambassador_codes where event_id=p_event_id and code=normalized and ambassador_id<>a) then raise exception 'This code belongs to another ambassador'; end if;
 update public.ambassador_codes set is_active=false where ambassador_id=a;
 insert into public.ambassador_codes(ambassador_id,event_id,code,is_active) values(a,p_event_id,normalized,p_active)
 on conflict(event_id,code) do update set is_active=excluded.is_active;
 insert into public.campus_audit_log(actor_id,action,record_id,details) values(auth.uid(),'save_ambassador',a::text,jsonb_build_object('code',normalized,'active',p_active));
 return a;
end $$;
create function public.save_campus_ambassador(p_id uuid,p_event_id uuid,p_name text,p_university text,p_email text,p_phone text,p_code text,p_active boolean,p_prefix text default 'CAMPUS')
returns uuid language sql set search_path='' as $$ select private.save_campus_ambassador(p_id,p_event_id,p_name,p_university,p_email,p_phone,p_code,p_active,p_prefix); $$;

create function private.save_event_sales_rules(p_event_id uuid,p_prices jsonb,p_discounts jsonb,p_commissions jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
 perform 1 from public.events where id=p_event_id for update;
 insert into public.event_sales_rules(event_id,price_tiers,discount_tiers,commission_tiers) values(p_event_id,p_prices,p_discounts,p_commissions)
 on conflict(event_id) do update set price_tiers=excluded.price_tiers,discount_tiers=excluded.discount_tiers,commission_tiers=excluded.commission_tiers;
 insert into public.campus_audit_log(actor_id,action,record_id,details) values(auth.uid(),'save_rules',p_event_id::text,jsonb_build_object('prices',p_prices,'discounts',p_discounts,'commissions',p_commissions));
end $$;
create function public.save_event_sales_rules(p_event_id uuid,p_prices jsonb,p_discounts jsonb,p_commissions jsonb)
returns void language sql set search_path='' as $$ select private.save_event_sales_rules(p_event_id,p_prices,p_discounts,p_commissions); $$;

create function private.issue_ambassador_entry(p_ambassador_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare a public.campus_ambassadors; e public.events; customer uuid; b public.bookings; occupied integer;
begin
 if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
 select * into a from public.campus_ambassadors where id=p_ambassador_id;
 select * into e from public.events where id=a.event_id for update;
 select * into a from public.campus_ambassadors where id=p_ambassador_id for update;
 select * into b from public.bookings where complimentary_ambassador_id=a.id;
 if b.id is not null then return b.payment_token; end if;
 if a.id is null or not a.is_active or a.email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' or char_length(a.phone)<6 then raise exception 'Add an active ambassador with a valid email and phone first'; end if;
 select coalesce(sum(guest_count),0) into occupied from public.bookings where event_id=e.id and status in ('pending','confirmed');
 select occupied+coalesce(sum(quantity),0) into occupied from public.event_price_quotes where event_id=e.id and booking_id is null and expires_at>now();
 if e.capacity is not null and occupied+1>e.capacity then raise exception 'Not enough event capacity remains'; end if;
 insert into public.customers as c(full_name,email,phone) values(a.name,a.email,a.phone) on conflict(lower(email)) do update set phone=excluded.phone returning c.id into customer;
 insert into public.bookings(customer_id,booking_type,event_id,status,scheduled_at,guest_count,total_amount,currency,complimentary_ambassador_id,services_confirmed_at,event_ticket_issued_at,selections)
 values(customer,'event',e.id,'confirmed',e.starts_at,1,0,'EGP',a.id,now(),now(),jsonb_build_object('complimentaryAmbassador',true,'ticketLabel','Campus Ambassador · Complimentary','ticketSubtotalEgp',0,'bookingFeesEgp',0,'totalEgp',0)) returning * into b;
 insert into public.booking_guests(booking_id,full_name,phone,is_primary) values(b.id,a.name,a.phone,true);
 insert into public.campus_audit_log(actor_id,action,record_id,details) values(auth.uid(),'issue_entry',a.id::text,jsonb_build_object('booking',b.booking_number));
 return b.payment_token;
end $$;
create function public.issue_ambassador_entry(p_ambassador_id uuid) returns uuid language sql set search_path='' as $$ select private.issue_ambassador_entry(p_ambassador_id); $$;

-- Add the explicit complimentary entitlement to the existing ticket gate.
create or replace function private.issue_paid_halloween_ticket() returns trigger language plpgsql set search_path='' as $$
begin
 if new.booking_type='event' and exists(select 1 from public.events where id=new.event_id and slug='halloween-party-2026') then
  if new.status<>'cancelled' and ((new.total_amount>0 and new.amount_paid>=new.total_amount) or (new.total_amount=0 and new.complimentary_ambassador_id is not null)) then
   new.status:='confirmed'; new.services_confirmed_at:=coalesce(new.services_confirmed_at,now()); new.confirmation_ready_at:=coalesce(new.confirmation_ready_at,now());new.event_ticket_issued_at:=coalesce(new.event_ticket_issued_at,now());
  else new.event_ticket_issued_at:=null; if new.status='confirmed' then new.status:='pending'; end if;
  end if;
 end if; return new;
end $$;
revoke all on function private.validate_sales_rules(),private.tier_value(jsonb,integer,text),private.accrue_ambassador_commission(),private.save_campus_ambassador(uuid,uuid,text,text,text,text,text,boolean,text),private.save_event_sales_rules(uuid,jsonb,jsonb,jsonb),private.issue_ambassador_entry(uuid) from public,anon,authenticated;
grant execute on function private.tier_value(jsonb,integer,text) to service_role;
grant execute on function private.save_campus_ambassador(uuid,uuid,text,text,text,text,text,boolean,text),private.save_event_sales_rules(uuid,jsonb,jsonb,jsonb),private.issue_ambassador_entry(uuid) to authenticated;
revoke all on function public.save_campus_ambassador(uuid,uuid,text,text,text,text,text,boolean,text),public.save_event_sales_rules(uuid,jsonb,jsonb,jsonb),public.issue_ambassador_entry(uuid) from public,anon;
grant execute on function public.save_campus_ambassador(uuid,uuid,text,text,text,text,text,boolean,text),public.save_event_sales_rules(uuid,jsonb,jsonb,jsonb),public.issue_ambassador_entry(uuid) to authenticated;

create function public.attach_event_receipt(p_token uuid,p_method text,p_path text) returns void language plpgsql set search_path='' as $$
declare b public.bookings;
begin
 if current_user not in ('service_role','postgres') then raise exception 'Not authorized'; end if;
 select * into b from public.bookings where payment_token=p_token and event_quote_id is not null for update;
 if b.id is null or b.status='cancelled' then raise exception 'This booking is unavailable'; end if;
 if b.amount_paid>=b.total_amount then return; end if;
 if p_method is null or p_method not in ('instapay','vodafone_cash') or p_path is null or p_path !~ '^pending/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then raise exception 'A valid payment receipt is required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_path,0));
 if exists(select 1 from public.payments where payment_proof_path=p_path and booking_id=b.id) then return; end if;
 if exists(select 1 from public.payments where payment_proof_path=p_path) then raise exception 'This receipt is already linked to a booking'; end if;
 if exists(select 1 from public.payments where booking_id=b.id and status='pending' and payment_proof_path is not null) then raise exception 'A receipt is already awaiting verification for this booking'; end if;
 if not exists(select 1 from storage.objects where bucket_id='payment-proofs' and name=p_path) then raise exception 'Payment receipt upload is missing'; end if;
 insert into public.payments(booking_id,amount,currency,payment_method,status,provider,gateway_status,payment_proof_path,notes) values(b.id,b.total_amount-b.amount_paid,'EGP',p_method,'pending','manual','pending',p_path,'Event transfer receipt awaiting verification.');
end $$;
revoke all on function public.attach_event_receipt(uuid,text,text) from public,anon,authenticated;
grant execute on function public.attach_event_receipt(uuid,text,text) to service_role;

create function public.event_sales_summary(p_event_id uuid) returns jsonb language sql set search_path='' as $$
 select jsonb_build_object('nextPrice',private.tier_value(r.price_tiers,
  (select coalesce(sum(guest_count),0)::integer from public.bookings where event_id=r.event_id and status in ('pending','confirmed') and complimentary_ambassador_id is null)
  +(select coalesce(sum(quantity),0)::integer from public.event_price_quotes where event_id=r.event_id and booking_id is null and expires_at>now())+1,'price'))
 from public.event_sales_rules r where r.event_id=p_event_id;
$$;
revoke all on function public.event_sales_summary(uuid) from public,anon,authenticated;
grant execute on function public.event_sales_summary(uuid) to service_role;

create function private.protect_event_price_snapshot() returns trigger language plpgsql set search_path='' as $$
begin
 if old.event_quote_id is not null and (new.total_amount is distinct from old.total_amount or new.guest_count is distinct from old.guest_count or new.event_id is distinct from old.event_id or new.event_quote_id is distinct from old.event_quote_id or new.ambassador_id is distinct from old.ambassador_id or new.ambassador_code is distinct from old.ambassador_code or
  (new.selections-'paymentProof') is distinct from (old.selections-'paymentProof')) then raise exception 'The saved event price and attribution are immutable. Create a separate correction'; end if;
 return new;
end $$;
revoke all on function private.protect_event_price_snapshot() from public,anon,authenticated;
create trigger protect_event_price_snapshot before update on public.bookings for each row execute function private.protect_event_price_snapshot();

create function private.campus_admin_report(p_event_id uuid,p_code text,p_offset integer) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
 return jsonb_build_object(
 'ambassadors',(select coalesce(jsonb_agg(row),'[]') from (
  select a.*, (select coalesce(jsonb_agg(jsonb_build_object('code',code,'active',is_active)),'[]') from public.ambassador_codes where ambassador_id=a.id) codes,
  (select count(*) from public.ambassador_commissions where ambassador_id=a.id and not is_void) confirmed_tickets,
  (select coalesce(sum(amount),0) from public.ambassador_commissions where ambassador_id=a.id and not is_void) commission,
  (select payment_token from public.bookings where complimentary_ambassador_id=a.id) entry_token
  from public.campus_ambassadors a where event_id=p_event_id order by created_at desc
 ) row),
 'bookings',(select coalesce(jsonb_agg(row),'[]') from (
  select b.id,b.booking_number,b.payment_token,b.status,b.guest_count,b.total_amount,b.amount_paid,b.ambassador_code,b.complimentary_ambassador_id,b.selections,b.created_at,
  (select full_name from public.customers where id=b.customer_id) customer_name,
  (select coalesce(sum(amount),0) from public.ambassador_commissions where booking_id=b.id and not is_void) commission,
  (select coalesce(jsonb_agg(jsonb_build_object('rate',rate,'amount',amount,'original',original_price,'position',confirmed_position,'void',is_void) order by ticket_index),'[]') from public.ambassador_commissions where booking_id=b.id) commission_lines
  from public.bookings b where event_id=p_event_id and (p_code is null or b.ambassador_code=upper(btrim(p_code)))
  order by created_at desc limit 100 offset greatest(0,least(coalesce(p_offset,0),100000))
 ) row),
 'booking_count',(select count(*) from public.bookings where event_id=p_event_id and (p_code is null or ambassador_code=upper(btrim(p_code)))),
 'confirmed_tickets',(select coalesce(sum(guest_count),0) from public.bookings where event_id=p_event_id and status='confirmed' and complimentary_ambassador_id is null),
 'pending_tickets',(select coalesce(sum(guest_count),0) from public.bookings where event_id=p_event_id and status='pending'),
 'active_quote_tickets',(select coalesce(sum(quantity),0) from public.event_price_quotes where event_id=p_event_id and booking_id is null and expires_at>now()));
end $$;
create function public.campus_admin_report(p_event_id uuid,p_code text default null,p_offset integer default 0) returns jsonb language sql set search_path='' as $$ select private.campus_admin_report(p_event_id,p_code,p_offset); $$;
revoke all on function private.campus_admin_report(uuid,text,integer),public.campus_admin_report(uuid,text,integer) from public,anon;
grant execute on function private.campus_admin_report(uuid,text,integer),public.campus_admin_report(uuid,text,integer) to authenticated;
