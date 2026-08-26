-- Fix the public request email check. The original POSIX pattern contained a
-- double-escaped dot, so valid addresses such as name@example.com were rejected.
-- A character class avoids string/backslash ambiguity entirely.
create or replace function private.submit_public_request(
  p_request_type public.pi_request_type,
  p_product_id uuid,
  p_external_subject_id text,
  p_subject_slug text,
  p_subject_title text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_guest_count integer,
  p_scheduled_at timestamptz,
  p_selections jsonb,
  p_notes text,
  p_policy_slugs text[]
)
returns table (id uuid, request_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_request public.requests;
  v_required text[] := case when p_request_type = 'application'
    then array['terms', 'privacy']
    else array['booking', 'cancellation', 'refund', 'payment', 'terms', 'privacy'] end;
  v_policy public.policies;
begin
  if char_length(trim(coalesce(p_full_name, ''))) not between 2 and 120 then raise exception 'A valid name is required'; end if;
  if char_length(trim(coalesce(p_email, ''))) > 254 or coalesce(p_email, '') !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'A valid email is required'; end if;
  if char_length(trim(coalesce(p_phone, ''))) > 40 then raise exception 'Phone number is too long'; end if;
  if char_length(trim(coalesce(p_external_subject_id, ''))) > 120 then raise exception 'Subject reference is too long'; end if;
  if char_length(trim(coalesce(p_subject_slug, ''))) > 160 then raise exception 'Subject slug is too long'; end if;
  if char_length(trim(coalesce(p_subject_title, ''))) > 160 then raise exception 'Subject title is too long'; end if;
  if char_length(trim(coalesce(p_notes, ''))) > 2000 then raise exception 'Notes are too long'; end if;
  if jsonb_typeof(coalesce(p_selections, '{}'::jsonb)) <> 'object' or pg_column_size(coalesce(p_selections, '{}'::jsonb)) > 20000 then raise exception 'Selection details are invalid'; end if;
  if p_guest_count is not null and p_guest_count < 1 then raise exception 'Guest count must be positive'; end if;
  if p_request_type <> 'application' and char_length(trim(coalesce(p_subject_title, ''))) not between 2 and 160 then raise exception 'A trip or event reference is required'; end if;
  if not v_required <@ coalesce(p_policy_slugs, array[]::text[]) then raise exception 'Required policies must be accepted'; end if;

  if exists (
    select 1
    from unnest(v_required) as required_policy(slug)
    left join public.policies policy on policy.slug = required_policy.slug
    where policy.id is null or not policy.is_active or btrim(policy.body) = ''
  ) then raise exception 'Required policies are not published'; end if;

  if exists (
    select 1
    from public.requests existing_request
    join public.customers existing_customer on existing_customer.id = existing_request.customer_id
    where existing_customer.email = lower(trim(p_email))
      and existing_request.request_type = p_request_type
      and existing_request.created_at > now() - interval '5 minutes'
  ) then raise exception 'Please wait before submitting the same request again'; end if;

  if p_request_type = 'trip' and p_product_id is not null and not exists (select 1 from public.trips where id = p_product_id and is_published) then raise exception 'Trip is unavailable'; end if;
  if p_request_type = 'event' and p_product_id is not null and not exists (select 1 from public.events where id = p_product_id and is_published) then raise exception 'Event is unavailable'; end if;
  if p_request_type = 'application' and p_product_id is not null then raise exception 'Applications cannot reference a product'; end if;

  insert into public.customers(full_name, email, phone, auth_user_id)
  values (trim(p_full_name), lower(trim(p_email)), nullif(trim(coalesce(p_phone, '')), ''), auth.uid())
  on conflict (lower(email)) do update set
    full_name = excluded.full_name,
    phone = coalesce(excluded.phone, public.customers.phone),
    auth_user_id = coalesce(public.customers.auth_user_id, excluded.auth_user_id),
    updated_at = now()
  returning id into v_customer_id;

  insert into public.requests(
    request_type, customer_id, trip_id, event_id, external_subject_id,
    subject_slug, subject_title, guest_count, travel_or_event_at, selections, notes
  ) values (
    p_request_type, v_customer_id,
    case when p_request_type = 'trip' then p_product_id end,
    case when p_request_type = 'event' then p_product_id end,
    nullif(trim(coalesce(p_external_subject_id, '')), ''),
    nullif(trim(coalesce(p_subject_slug, '')), ''),
    nullif(trim(coalesce(p_subject_title, '')), ''),
    p_guest_count, p_scheduled_at, coalesce(p_selections, '{}'::jsonb), nullif(trim(coalesce(p_notes, '')), '')
  ) returning * into v_request;

  for v_policy in select * from public.policies where slug = any(v_required) and is_active loop
    insert into public.policy_acceptances(policy_id, policy_version, customer_id, request_id)
    values (v_policy.id, v_policy.version, v_customer_id, v_request.id);
  end loop;

  if (select count(*) from public.policy_acceptances where request_id = v_request.id) <> cardinality(v_required) then
    raise exception 'A required policy is not active';
  end if;

  return query select v_request.id, v_request.request_number;
end;
$$;
