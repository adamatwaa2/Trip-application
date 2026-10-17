-- Owner requested immediate self-registration and code activation (no admin approval).
-- Service-only atomic path; ordinary anonymous clients cannot write these tables.
alter table public.campus_ambassador_applications add column tracking_token uuid not null default gen_random_uuid() unique;

create function public.register_campus_leader(p_event_id uuid,p_name text,p_university text,p_email text,p_phone text,p_consent boolean,p_university_prefix text,p_requested_code text,p_tracking_token uuid)
returns uuid language plpgsql set search_path='' as $$
<<registration>>
declare policy_version text; prefix text:=upper(btrim(p_university_prefix)); code text:=upper(btrim(p_requested_code)); a uuid; application uuid; existing public.campus_ambassador_applications;
begin
 if current_user not in ('service_role','postgres') then raise exception 'Not authorized'; end if;
 if p_tracking_token is null or prefix is null or prefix !~ '^[A-Z]{2,10}$' or code is null or code !~ '^[A-Z][A-Z0-9-]{2,23}$' or left(code,length(prefix))<>prefix or length(code)<=length(prefix) then raise exception 'Code must start with your university abbreviation'; end if;
 if p_consent is distinct from true or p_name is null or char_length(btrim(p_name)) not between 2 and 120 or p_university is null or char_length(btrim(p_university)) not between 2 and 120 or p_phone is null or char_length(btrim(p_phone)) not between 6 and 40 or p_email is null or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' or char_length(p_email)>254 then raise exception 'Check your details and privacy consent'; end if;
 perform 1 from public.events e join public.event_sales_rules r on r.event_id=e.id where e.id=p_event_id and e.is_published for update of e;
 if not found then raise exception 'Applications are unavailable'; end if;
 select * into existing from public.campus_ambassador_applications where tracking_token=p_tracking_token;
 if existing.id is not null then
  if existing.event_id=p_event_id and existing.email=lower(btrim(p_email)) then return existing.tracking_token; end if;
  raise exception 'Registration unavailable';
 end if;
 if exists(select 1 from public.campus_ambassador_applications where event_id=p_event_id and lower(email)=lower(btrim(p_email))) or exists(select 1 from public.campus_ambassadors where event_id=p_event_id and lower(email)=lower(btrim(p_email))) then raise exception 'Registration already exists. Contact Planet Infinity to recover your private link'; end if;
 if exists(select 1 from public.ambassador_codes where event_id=p_event_id and ambassador_codes.code=registration.code) then raise exception 'Code is already taken. Choose another code'; end if;
 select version into policy_version from public.policies where slug='privacy' and is_active and body<>'';
 if policy_version is null then raise exception 'Applications are unavailable'; end if;
 insert into public.campus_ambassadors(event_id,name,university,email,phone,is_active) values(p_event_id,btrim(p_name),btrim(p_university),lower(btrim(p_email)),btrim(p_phone),true) returning id into a;
 insert into public.ambassador_codes(ambassador_id,event_id,code,is_active) values(a,p_event_id,code,true);
 insert into public.campus_ambassador_applications(event_id,full_name,university,email,phone,privacy_version,university_prefix,requested_code,status,ambassador_id,reviewed_at,tracking_token)
 values(p_event_id,btrim(p_name),btrim(p_university),lower(btrim(p_email)),btrim(p_phone),policy_version,prefix,code,'approved',a,now(),p_tracking_token) returning id into application;
 insert into public.campus_audit_log(action,record_id,details) values('self_register_ambassador',a::text,jsonb_build_object('application',application,'code',code,'automatic',true));
 return p_tracking_token;
end $$;
revoke all on function public.register_campus_leader(uuid,text,text,text,text,boolean,text,text,uuid) from public,anon,authenticated;
grant execute on function public.register_campus_leader(uuid,text,text,text,text,boolean,text,text,uuid) to service_role;
