-- Interest forms never create or activate a referral code. An active admin approves.
create table public.campus_ambassador_applications (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id),
 full_name text not null check(char_length(full_name) between 2 and 120),
 university text not null check(char_length(university) between 2 and 120),
 email text not null check(char_length(email)<=254), phone text not null check(char_length(phone) between 6 and 40),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 ambassador_id uuid references public.campus_ambassadors(id),
 privacy_version text not null, consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid references public.admin_users(id)
);
create unique index campus_applications_email on public.campus_ambassador_applications(event_id,lower(email));
create index campus_applications_pending on public.campus_ambassador_applications(event_id,status,created_at desc);
alter table public.campus_ambassador_applications enable row level security;
revoke all on public.campus_ambassador_applications from anon,authenticated;
grant all on public.campus_ambassador_applications to service_role;
grant select on public.campus_ambassador_applications to authenticated;
create policy campus_applications_admin_read on public.campus_ambassador_applications for select to authenticated using ((select private.is_pi_admin()));

create function public.submit_campus_interest(p_event_id uuid,p_name text,p_university text,p_email text,p_phone text,p_consent boolean)
returns boolean language plpgsql set search_path='' as $$
declare policy_version text;
begin
 if current_user not in ('service_role','postgres') then raise exception 'Not authorized'; end if;
 if p_consent is distinct from true or char_length(btrim(p_name)) not between 2 and 120 or char_length(btrim(p_university)) not between 2 and 120 or char_length(btrim(p_phone)) not between 6 and 40 or p_name is null or p_university is null or p_phone is null then raise exception 'Check your application details and privacy consent'; end if;
 if p_email is null or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' or char_length(p_email)>254 then raise exception 'Enter a valid email'; end if;
 if not exists(select 1 from public.events e join public.event_sales_rules r on r.event_id=e.id where e.id=p_event_id and e.is_published) then raise exception 'Applications are unavailable for this event'; end if;
 select version into policy_version from public.policies where slug='privacy' and is_active and body<>'';
 if policy_version is null then raise exception 'Applications are temporarily unavailable'; end if;
 insert into public.campus_ambassador_applications(event_id,full_name,university,email,phone,privacy_version)
 values(p_event_id,btrim(p_name),btrim(p_university),lower(btrim(p_email)),btrim(p_phone),policy_version)
 on conflict(event_id,lower(email)) do nothing;
 return true;
end $$;
revoke all on function public.submit_campus_interest(uuid,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.submit_campus_interest(uuid,text,text,text,text,boolean) to service_role;

create function private.review_campus_application(p_id uuid,p_approve boolean,p_prefix text)
returns uuid language plpgsql security definer set search_path='' as $$
declare application public.campus_ambassador_applications; ambassador uuid;
begin
 if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
 select * into application from public.campus_ambassador_applications where id=p_id for update;
 if application.id is null then raise exception 'Application not found'; end if;
 if application.status='approved' then return application.ambassador_id; end if;
 if p_approve then
  ambassador:=private.save_campus_ambassador(null,application.event_id,application.full_name,application.university,application.email,application.phone,null,true,p_prefix);
 end if;
 update public.campus_ambassador_applications set status=case when p_approve then 'approved' else 'rejected' end,ambassador_id=ambassador,reviewed_by=auth.uid(),reviewed_at=now() where id=application.id;
 insert into public.campus_audit_log(actor_id,action,record_id,details) values(auth.uid(),'review_application',application.id::text,jsonb_build_object('approved',p_approve,'ambassador',ambassador));
 return ambassador;
end $$;
create function public.review_campus_application(p_id uuid,p_approve boolean,p_prefix text default null) returns uuid language sql set search_path='' as $$ select private.review_campus_application(p_id,p_approve,p_prefix); $$;
revoke all on function private.review_campus_application(uuid,boolean,text),public.review_campus_application(uuid,boolean,text) from public,anon;
grant execute on function private.review_campus_application(uuid,boolean,text),public.review_campus_application(uuid,boolean,text) to authenticated;
