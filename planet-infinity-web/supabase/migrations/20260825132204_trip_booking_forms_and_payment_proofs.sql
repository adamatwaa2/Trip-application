-- Per-trip booking questions and private customer payment proofs.

alter table public.trips
  add column booking_form_fields jsonb not null default '[]'::jsonb,
  add column payment_proof_required boolean not null default true,
  add constraint trips_booking_form_fields_array_check
    check (jsonb_typeof(booking_form_fields) = 'array'),
  add constraint trips_booking_form_fields_size_check
    check (pg_column_size(booking_form_fields) <= 65536);

alter table public.payments
  drop constraint if exists payments_payment_method_check;
alter table public.payments
  add constraint payments_payment_method_check
  check (payment_method in (
    'cash', 'bank_transfer', 'instapay', 'vodafone_cash',
    'card_terminal', 'paymob_card', 'other'
  ));

alter table public.requests
  add column payment_method text,
  add column payment_proof_path text,
  add constraint requests_payment_method_check
    check (payment_method is null or payment_method in ('instapay', 'vodafone_cash')),
  add constraint requests_payment_proof_pair_check
    check ((payment_method is null) = (payment_proof_path is null)),
  add constraint requests_payment_proof_path_check
    check (
      payment_proof_path is null
      or payment_proof_path ~ '^pending/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    );

create function private.populate_request_payment_proof()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment jsonb;
  v_fields jsonb := '[]'::jsonb;
  v_answers jsonb := '{}'::jsonb;
  v_field jsonb;
  v_answer jsonb;
  v_payment_required boolean := false;
begin
  if new.request_type = 'trip' and new.trip_id is not null then
    select trip.booking_form_fields, trip.payment_proof_required
      into v_fields, v_payment_required
    from public.trips trip
    where trip.id = new.trip_id;

    v_answers := coalesce(new.selections -> 'customAnswers', '{}'::jsonb);
    if jsonb_typeof(v_answers) <> 'object' then
      raise exception 'Invalid custom booking answers';
    end if;

    for v_field in select value from jsonb_array_elements(v_fields)
    loop
      if coalesce((v_field ->> 'required')::boolean, false) then
        v_answer := v_answers -> (v_field ->> 'id');
        if v_answer is null
           or v_answer = 'null'::jsonb
           or (jsonb_typeof(v_answer) = 'string' and btrim(v_answer #>> '{}') = '')
           or (jsonb_typeof(v_answer) = 'array' and jsonb_array_length(v_answer) = 0)
           or (v_field ->> 'type' = 'checkbox' and v_answer <> 'true'::jsonb)
        then
          raise exception 'A required trip question is missing';
        end if;
      end if;
    end loop;
  end if;

  v_payment := new.selections -> 'paymentProof';
  if v_payment is null then
    new.payment_method := null;
    new.payment_proof_path := null;
    if v_payment_required then
      raise exception 'Payment proof is required for this trip';
    end if;
    return new;
  end if;

  if jsonb_typeof(v_payment) <> 'object' then
    raise exception 'Invalid payment proof';
  end if;

  new.payment_method := nullif(trim(v_payment ->> 'method'), '');
  new.payment_proof_path := nullif(trim(v_payment ->> 'path'), '');
  return new;
end;
$$;
revoke all on function private.populate_request_payment_proof() from public, anon, authenticated;

create trigger requests_populate_payment_proof
before insert or update of selections on public.requests
for each row execute function private.populate_request_payment_proof();

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'payment-proofs', 'payment-proofs', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists payment_proofs_admin_select on storage.objects;
create policy payment_proofs_admin_select
  on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (select private.is_pi_admin()));

drop policy if exists payment_proofs_admin_delete on storage.objects;
create policy payment_proofs_admin_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'payment-proofs' and (select private.is_pi_admin()));

comment on column public.trips.booking_form_fields is
  'Admin-defined questions added after the fixed booking contact fields.';
comment on column public.trips.payment_proof_required is
  'Requires a private InstaPay or Vodafone Cash receipt before submitting the trip booking request.';
comment on column public.requests.payment_proof_path is
  'Private Storage path for the customer-supplied receipt; never a public URL.';
