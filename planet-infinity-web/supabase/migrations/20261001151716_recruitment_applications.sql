-- Recruitment applications remain requests, so legacy applications and the
-- existing secure admin/customer model stay intact. The extra columns are
-- nullable for trips/events and are populated only by the narrow intake RPC.
alter table public.requests
  add column if not exists application_status text,
  add column if not exists application_category text,
  add column if not exists application_world text,
  add column if not exists application_role text,
  add column if not exists application_country text,
  add column if not exists application_city text,
  add column if not exists application_egypt_based boolean,
  add column if not exists application_work_mode text;

alter table public.requests drop constraint if exists requests_application_status_check;
alter table public.requests add constraint requests_application_status_check
  check (application_status is null or application_status in ('new','reviewing','shortlisted','interview','challenge','accepted','rejected','waitlist'));
alter table public.requests drop constraint if exists requests_application_category_check;
alter table public.requests add constraint requests_application_category_check
  check (application_category is null or application_category in ('world-crew','core-team','creative-studio'));
alter table public.requests drop constraint if exists requests_application_fields_scope_check;
alter table public.requests add constraint requests_application_fields_scope_check
  check (request_type = 'application' or (application_status is null and application_category is null and application_world is null and application_role is null));

update public.requests
set application_status = case when status = 'rejected' then 'rejected' when status in ('accepted','confirmed') then 'accepted' else 'new' end
where request_type = 'application' and application_status is null;

create index if not exists requests_application_queue_idx
  on public.requests(application_status, created_at desc)
  where request_type = 'application' and archived_at is null;
create index if not exists requests_application_filter_idx
  on public.requests(application_category, application_world, application_role, application_country)
  where request_type = 'application' and archived_at is null;

-- Roles, worlds and required questions are validated from content/recruitment.ts
-- by the server action. Only the server service role may call this intake.
create unique index if not exists requests_recruitment_draft_idx
  on public.requests ((selections ->> 'draftId'))
  where selections ->> 'kind' = 'recruitment';

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('recruitment-files','recruitment-files',false,5242880,array[
  'image/jpeg','image/png','image/webp'
]) on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create policy recruitment_files_admin_read on storage.objects
  for select to authenticated
  using (bucket_id='recruitment-files' and (select private.is_pi_admin()));

create or replace function private.submit_recruitment_application(p_payload jsonb)
returns table (id uuid, request_number text)
language plpgsql security definer set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_request public.requests;
  v_email text := lower(trim(coalesce(p_payload ->> 'email','')));
  v_name text := trim(coalesce(p_payload ->> 'fullName',''));
  v_phone text := trim(coalesce(p_payload ->> 'phone',''));
  v_category text := coalesce(p_payload ->> 'category','');
  v_world text := nullif(trim(coalesce(p_payload ->> 'world','')),'');
  v_role text := trim(coalesce(p_payload ->> 'role',''));
  v_draft text := coalesce(p_payload ->> 'draftId','');
  v_policy public.policies;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or pg_column_size(p_payload)>50000 then raise exception 'Invalid application'; end if;
  if char_length(v_name) not between 2 and 120 then raise exception 'A valid name is required'; end if;
  if char_length(v_email)>254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'A valid email is required'; end if;
  if char_length(v_phone) not between 6 and 40 then raise exception 'A valid phone is required'; end if;
  if v_category not in ('world-crew','core-team','creative-studio') or char_length(v_role) not between 2 and 80 then raise exception 'A valid role is required'; end if;
  if v_category='world-crew' and v_world is null then raise exception 'A valid world is required'; end if;
  if v_category<>'world-crew' then v_world:=null; end if;
  if v_draft !~ '^[0-9a-f-]{36}$' then raise exception 'Invalid draft'; end if;
  if coalesce(p_payload ->> 'age','') !~ '^[0-9]{1,3}$' then raise exception 'A valid age is required'; end if;
  if (p_payload ->> 'age')::integer < 1 then raise exception 'A valid age is required'; end if;
  if char_length(trim(coalesce(p_payload ->> 'city',''))) not between 2 and 120 or char_length(trim(coalesce(p_payload ->> 'country',''))) not between 2 and 120 then raise exception 'A valid location is required'; end if;
  if jsonb_typeof(p_payload -> 'answers') is distinct from 'object' then raise exception 'Answers are invalid'; end if;
  if coalesce(p_payload ->> 'termsAccepted','false') <> 'true' then raise exception 'Privacy acceptance is required'; end if;

  -- Serialize retries for the same draft/email before deduplication.
  perform pg_advisory_xact_lock(hashtextextended(v_email,0));
  select r.* into v_request from public.requests r
    where r.selections ->> 'kind'='recruitment' and r.selections ->> 'draftId'=v_draft
      and r.contact_email=v_email;
  if v_request.id is not null then
    return query select v_request.id,v_request.request_number;
    return;
  end if;

  if exists (
    select 1 from unnest(array['terms','privacy']::text[]) required(slug)
    left join public.policies policy on policy.slug=required.slug
    where policy.id is null or not policy.is_active or btrim(policy.body)=''
  ) then raise exception 'Required policies are not published'; end if;
  if exists (
    select 1 from public.requests r join public.customers c on c.id=r.customer_id
    where r.request_type='application' and c.email=v_email and r.created_at>now()-interval '5 minutes'
  ) then raise exception 'Please wait before submitting the same application again'; end if;

  insert into public.customers as c(full_name,email,phone,auth_user_id)
  values(v_name,v_email,v_phone,null)
  on conflict(lower(email)) do update set full_name=excluded.full_name,phone=coalesce(excluded.phone,c.phone),updated_at=now()
  returning c.id into v_customer_id;

  insert into public.requests(
    request_type,status,customer_id,external_subject_id,subject_slug,subject_title,
    selections,notes,contact_name,contact_email,contact_phone,
    application_status,application_category,application_world,application_role,
    application_country,application_city,application_egypt_based,application_work_mode
  ) values(
    'application','pending',v_customer_id,'recruitment','join','Careers — '||v_role,
    p_payload||jsonb_build_object('kind','recruitment','submittedVersion',1),
    'RECRUITMENT APPLICATION — '||v_category||' — '||v_role,v_name,v_email,v_phone,
    'new',v_category,v_world,v_role,trim(p_payload ->> 'country'),trim(p_payload ->> 'city'),
    (p_payload ->> 'egyptBased')='Yes',p_payload ->> 'workMode'
  ) returning * into v_request;
  for v_policy in select * from public.policies where slug=any(array['terms','privacy']::text[]) and is_active loop
    insert into public.policy_acceptances(policy_id,policy_version,customer_id,request_id)
    values(v_policy.id,v_policy.version,v_customer_id,v_request.id);
  end loop;
  return query select v_request.id,v_request.request_number;
end;
$$;

create or replace function public.submit_recruitment_application(p_payload jsonb)
returns table (id uuid, request_number text)
language sql security invoker set search_path = ''
as $$ select * from private.submit_recruitment_application(p_payload); $$;

create or replace function private.update_recruitment_application(p_request_id uuid,p_status text,p_note text default null)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
  if p_status is null or p_status not in ('new','reviewing','shortlisted','interview','challenge','accepted','rejected','waitlist') then raise exception 'Invalid status'; end if;
  if char_length(coalesce(p_note,''))>2000 then raise exception 'Note is too long'; end if;
  if not exists(select 1 from public.requests where id=p_request_id and request_type='application') then raise exception 'Application not found'; end if;
  update public.requests set application_status=p_status,admin_note=nullif(trim(coalesce(p_note,'')),''),updated_by=auth.uid(),updated_at=now() where id=p_request_id;
end;
$$;
create or replace function public.update_recruitment_application(p_request_id uuid,p_status text,p_note text default null)
returns void language sql security invoker set search_path = ''
as $$ select private.update_recruitment_application(p_request_id,p_status,p_note); $$;

revoke all on function private.submit_recruitment_application(jsonb) from public,anon,authenticated;
revoke all on function public.submit_recruitment_application(jsonb) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.submit_recruitment_application(jsonb) to service_role;
grant execute on function public.submit_recruitment_application(jsonb) to service_role;
revoke all on function private.update_recruitment_application(uuid,text,text) from public,anon,authenticated;
revoke all on function public.update_recruitment_application(uuid,text,text) from public,anon,authenticated;
grant execute on function private.update_recruitment_application(uuid,text,text) to authenticated;
grant execute on function public.update_recruitment_application(uuid,text,text) to authenticated;
