-- Keep privileged implementation details outside every API-exposed schema.
-- The public functions below are SECURITY INVOKER wrappers only; callers can
-- reach the private implementations through those narrow, validated APIs.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter function public.is_pi_admin() set schema private;
alter function public.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[]
) set schema private;
alter function public.update_request_status(uuid, public.pi_status, text) set schema private;
alter function public.convert_request_to_booking(uuid, numeric, text) set schema private;
alter function public.record_manual_payment(
  uuid, numeric, text, public.pi_payment_status, timestamptz, text, text
) set schema private;
alter function public.recalculate_booking_paid_amount() set schema private;

-- Moving a function preserves its ACL. Reset every private implementation to
-- least privilege before granting only the role that needs to reach it.
revoke all on function private.is_pi_admin() from public, anon, authenticated;
revoke all on function private.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[]
) from public, anon, authenticated;
revoke all on function private.update_request_status(uuid, public.pi_status, text) from public, anon, authenticated;
revoke all on function private.convert_request_to_booking(uuid, numeric, text) from public, anon, authenticated;
revoke all on function private.record_manual_payment(
  uuid, numeric, text, public.pi_payment_status, timestamptz, text, text
) from public, anon, authenticated;
revoke all on function private.recalculate_booking_paid_amount() from public, anon, authenticated;

grant usage on schema private to anon, authenticated;
grant execute on function private.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[]
) to anon, authenticated;
grant execute on function private.is_pi_admin() to authenticated;
grant execute on function private.update_request_status(uuid, public.pi_status, text) to authenticated;
grant execute on function private.convert_request_to_booking(uuid, numeric, text) to authenticated;
grant execute on function private.record_manual_payment(
  uuid, numeric, text, public.pi_payment_status, timestamptz, text, text
) to authenticated;

-- Public API wrappers. They do not bypass RLS or gain owner privileges. The
-- private functions retain all validation and explicit administrator checks.
create function public.is_pi_admin()
returns boolean
language sql stable security invoker set search_path = '' as $$
  select private.is_pi_admin();
$$;

create function public.submit_public_request(
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
language sql security invoker set search_path = '' as $$
  select *
  from private.submit_public_request(
    p_request_type, p_product_id, p_external_subject_id, p_subject_slug,
    p_subject_title, p_full_name, p_email, p_phone, p_guest_count,
    p_scheduled_at, p_selections, p_notes, p_policy_slugs
  );
$$;

create function public.update_request_status(
  p_request_id uuid,
  p_status public.pi_status,
  p_note text default null
)
returns void
language sql security invoker set search_path = '' as $$
  select private.update_request_status(p_request_id, p_status, p_note);
$$;

create function public.convert_request_to_booking(
  p_request_id uuid,
  p_total_amount numeric,
  p_note text default null
)
returns table (id uuid, booking_number text)
language sql security invoker set search_path = '' as $$
  select *
  from private.convert_request_to_booking(p_request_id, p_total_amount, p_note);
$$;

create function public.record_manual_payment(
  p_booking_id uuid,
  p_amount numeric,
  p_method text,
  p_status public.pi_payment_status,
  p_received_at timestamptz default null,
  p_reference text default null,
  p_notes text default null
)
returns uuid
language sql security invoker set search_path = '' as $$
  select private.record_manual_payment(
    p_booking_id, p_amount, p_method, p_status, p_received_at,
    p_reference, p_notes
  );
$$;

revoke all on function public.is_pi_admin() from public, anon, authenticated;
revoke all on function public.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[]
) from public, anon, authenticated;
revoke all on function public.update_request_status(uuid, public.pi_status, text) from public, anon, authenticated;
revoke all on function public.convert_request_to_booking(uuid, numeric, text) from public, anon, authenticated;
revoke all on function public.record_manual_payment(
  uuid, numeric, text, public.pi_payment_status, timestamptz, text, text
) from public, anon, authenticated;

grant execute on function public.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[]
) to anon, authenticated;
grant execute on function public.is_pi_admin() to authenticated;
grant execute on function public.update_request_status(uuid, public.pi_status, text) to authenticated;
grant execute on function public.convert_request_to_booking(uuid, numeric, text) to authenticated;
grant execute on function public.record_manual_payment(
  uuid, numeric, text, public.pi_payment_status, timestamptz, text, text
) to authenticated;

-- Prevent future functions from accidentally inheriting broad EXECUTE grants.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

comment on schema private is 'Planet Infinity privileged database implementation; not exposed through the Data API.';
comment on function public.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[]
) is 'Validated public intake wrapper; privileged implementation lives in private schema.';
