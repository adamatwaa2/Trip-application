-- Optional fields preserve existing requests; all new public form requests require both.
alter table public.ambassador_codes add constraint ambassador_code_starts_letter check(code ~ '^[A-Z]');
alter table public.campus_ambassador_applications
 add column university_prefix text check(university_prefix ~ '^[A-Z]{2,10}$'),
 add column requested_code text check(requested_code ~ '^[A-Z][A-Z0-9-]{2,23}$'),
 add constraint campus_requested_prefix check (
  (university_prefix is null and requested_code is null) or
  (university_prefix is not null and requested_code is not null and
   left(requested_code,length(university_prefix))=university_prefix and length(requested_code)>length(university_prefix))
 );

create function public.submit_requested_campus_interest(p_event_id uuid,p_name text,p_university text,p_email text,p_phone text,p_consent boolean,p_university_prefix text,p_requested_code text)
returns boolean language plpgsql set search_path='' as $$
declare policy_version text; prefix text:=upper(btrim(p_university_prefix)); code text:=upper(btrim(p_requested_code));
begin
 if current_user not in ('service_role','postgres') then raise exception 'Not authorized'; end if;
 if prefix is null or prefix !~ '^[A-Z]{2,10}$' or code is null or code !~ '^[A-Z][A-Z0-9-]{2,23}$' or left(code,length(prefix))<>prefix or length(code)<=length(prefix) then raise exception 'Code must start with your university abbreviation'; end if;
 -- Reuse consent, contact and event validation without overwriting an existing application.
 -- The insert and enrichment share the same transaction; duplicate email requests stay immutable.
 select version into policy_version from public.policies where slug='privacy' and is_active and body<>'';
 if p_consent is distinct from true or p_name is null or char_length(btrim(p_name)) not between 2 and 120 or p_university is null or char_length(btrim(p_university)) not between 2 and 120 or p_phone is null or char_length(btrim(p_phone)) not between 6 and 40 or p_email is null or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' or char_length(p_email)>254 then raise exception 'Check your details and privacy consent'; end if;
 if policy_version is null or not exists(select 1 from public.events e join public.event_sales_rules r on r.event_id=e.id where e.id=p_event_id and e.is_published) then raise exception 'Applications are unavailable'; end if;
 insert into public.campus_ambassador_applications(event_id,full_name,university,email,phone,privacy_version,university_prefix,requested_code)
 values(p_event_id,btrim(p_name),btrim(p_university),lower(btrim(p_email)),btrim(p_phone),policy_version,prefix,code)
 on conflict(event_id,lower(email)) do nothing;
 return true;
end $$;
revoke all on function public.submit_requested_campus_interest(uuid,text,text,text,text,boolean,text,text) from public,anon,authenticated;
grant execute on function public.submit_requested_campus_interest(uuid,text,text,text,text,boolean,text,text) to service_role;

create or replace function private.review_campus_application(p_id uuid,p_approve boolean,p_prefix text)
returns uuid language plpgsql security definer set search_path='' as $$
declare application public.campus_ambassador_applications; ambassador uuid; code text:=upper(btrim(p_prefix));
begin
 if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
 select * into application from public.campus_ambassador_applications where id=p_id for update;
 if application.id is null then raise exception 'Application not found'; end if;
 if application.status='approved' then return application.ambassador_id; end if;
 if p_approve then
  if code is null or code !~ '^[A-Z][A-Z0-9-]{2,23}$' then raise exception 'Choose a code starting with a letter'; end if;
  if application.university_prefix is not null and (left(code,length(application.university_prefix))<>application.university_prefix or length(code)<=length(application.university_prefix)) then raise exception 'Code must start with the verified university abbreviation'; end if;
  ambassador:=private.save_campus_ambassador(null,application.event_id,application.full_name,application.university,application.email,application.phone,code,true,null);
 end if;
 update public.campus_ambassador_applications set status=case when p_approve then 'approved' else 'rejected' end,ambassador_id=ambassador,reviewed_by=auth.uid(),reviewed_at=now() where id=application.id;
 insert into public.campus_audit_log(actor_id,action,record_id,details) values(auth.uid(),'review_application',application.id::text,jsonb_build_object('approved',p_approve,'ambassador',ambassador));
 return ambassador;
end $$;
