-- Older clients always sent `seats: []`, even when seat selection was off.
-- Normalize that harmless empty value at the public boundary while keeping
-- the private function's rejection of real seat selections for disabled trips.
create or replace function public.submit_public_request(
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
  p_policy_slugs text[],
  p_whatsapp_opt_in boolean default false
)
returns table (id uuid, request_number text)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.submit_public_request(
    p_request_type,
    p_product_id,
    p_external_subject_id,
    p_subject_slug,
    p_subject_title,
    p_full_name,
    p_email,
    p_phone,
    p_guest_count,
    p_scheduled_at,
    case
      when jsonb_typeof(coalesce(p_selections, '{}'::jsonb) -> 'seats') = 'array'
        and jsonb_array_length(coalesce(p_selections, '{}'::jsonb) -> 'seats') = 0
      then coalesce(p_selections, '{}'::jsonb) - 'seats'
      else coalesce(p_selections, '{}'::jsonb)
    end,
    p_notes,
    p_policy_slugs,
    p_whatsapp_opt_in
  );
$$;

revoke all on function public.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[], boolean
) from public, anon, authenticated;

grant execute on function public.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[], boolean
) to anon, authenticated;
