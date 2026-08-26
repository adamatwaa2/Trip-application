-- Planet Infinity operational booking foundation.
--
-- This migration adds independent catalogue switches, product-linked
-- applications, collision-safe trip seat holds, the real booking lifecycle,
-- confirmation-document tracking, Paymob-ready payment metadata, WhatsApp
-- consent/outbox records, and tightly scoped Storage buckets.

-- ---------------------------------------------------------------------------
-- Catalogue capabilities
-- ---------------------------------------------------------------------------

alter table public.trips
  add column application_required boolean not null default false,
  add column seat_selection_enabled boolean not null default false,
  add column seat_config jsonb not null default '{}'::jsonb,
  add column document_url text,
  add column document_label text,
  add column return_at timestamptz,
  add column departure_point text,
  add column return_point text,
  add column package_label text,
  add column accommodation text,
  add column transportation text,
  add column important_information jsonb not null default '[]'::jsonb;

alter table public.events
  add column application_required boolean not null default false,
  add column document_url text,
  add column document_label text,
  add column important_information jsonb not null default '[]'::jsonb;

update public.trips
set application_required = true,
    booking_mode = 'request'
where booking_mode = 'application';

update public.events
set application_required = true,
    booking_mode = 'request'
where booking_mode = 'application';

alter table public.trips
  add constraint trips_document_url_length_check
    check (document_url is null or char_length(document_url) <= 2048),
  add constraint trips_document_label_length_check
    check (document_label is null or char_length(document_label) <= 120),
  add constraint trips_seat_config_object_check
    check (jsonb_typeof(seat_config) = 'object');

alter table public.events
  add constraint events_document_url_length_check
    check (document_url is null or char_length(document_url) <= 2048),
  add constraint events_document_label_length_check
    check (document_label is null or char_length(document_label) <= 120);

-- ---------------------------------------------------------------------------
-- Legal catalogue
-- ---------------------------------------------------------------------------

alter table public.policies drop constraint if exists policies_slug_check;
alter table public.policies
  add constraint policies_slug_check
  check (slug in ('booking', 'cancellation', 'refund', 'payment', 'terms', 'etiquette', 'privacy'));

insert into public.policies (slug, title, version, body, is_active)
values ('etiquette', 'Trip Etiquette', 'draft-1', '', false)
on conflict (slug) do nothing;

-- Empty legal copy must never be exposed as a published policy.
update public.policies
set is_active = false
where btrim(body) = '';

-- ---------------------------------------------------------------------------
-- Request consent and product-linked applications
-- ---------------------------------------------------------------------------

alter table public.requests
  add column whatsapp_opt_in boolean not null default false,
  add column whatsapp_opted_in_at timestamptz,
  add column contact_name text,
  add column contact_email text,
  add column contact_phone text;

update public.requests request
set contact_name = customer.full_name,
    contact_email = customer.email,
    contact_phone = customer.phone
from public.customers customer
where customer.id = request.customer_id;

alter table public.requests
  alter column contact_name set not null,
  alter column contact_email set not null,
  add constraint requests_contact_name_check
    check (char_length(trim(contact_name)) between 2 and 120),
  add constraint requests_contact_email_check
    check (contact_email = lower(contact_email) and char_length(contact_email) between 3 and 254),
  add constraint requests_contact_phone_check
    check (contact_phone is null or char_length(contact_phone) <= 40);

alter table public.requests drop constraint if exists requests_check;
alter table public.requests
  add constraint requests_product_shape_check check (
    (request_type = 'trip' and event_id is null)
    or (request_type = 'event' and trip_id is null)
    or (request_type = 'application' and num_nonnulls(trip_id, event_id) <= 1)
  ),
  add constraint requests_whatsapp_consent_check check (
    (whatsapp_opt_in and whatsapp_opted_in_at is not null)
    or (not whatsapp_opt_in and whatsapp_opted_in_at is null)
  );

-- ---------------------------------------------------------------------------
-- Seat holds and final reservations
-- ---------------------------------------------------------------------------

create table public.trip_seat_reservations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  request_id uuid not null references public.requests(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  seat_number integer not null check (seat_number between 1 and 80),
  status text not null default 'held'
    check (status in ('held', 'reserved', 'released', 'expired')),
  hold_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, seat_number),
  check (
    (status = 'held' and hold_expires_at is not null and booking_id is null)
    or (status = 'reserved' and hold_expires_at is null and booking_id is not null)
    or status in ('released', 'expired')
  )
);

create unique index trip_seat_reservations_active_seat_key
  on public.trip_seat_reservations (trip_id, seat_number)
  where status in ('held', 'reserved');
create index trip_seat_reservations_booking_id_idx
  on public.trip_seat_reservations (booking_id)
  where booking_id is not null;
create index trip_seat_reservations_expiry_idx
  on public.trip_seat_reservations (hold_expires_at)
  where status = 'held';

create trigger trip_seat_reservations_set_updated_at
before update on public.trip_seat_reservations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Booking lifecycle and confirmation documents
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column payment_token uuid not null default gen_random_uuid(),
  add column services_confirmed_at timestamptz,
  add column confirmation_ready_at timestamptz,
  add column confirmation_issued_at timestamptz,
  add column confirmation_pdf_path text,
  add column confirmation_version integer not null default 0,
  add column confirmation_sent_at timestamptz,
  add constraint bookings_payment_token_key unique (payment_token),
  add constraint bookings_confirmation_version_check check (confirmation_version >= 0);

create table public.booking_guests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index booking_guests_one_primary_key
  on public.booking_guests (booking_id)
  where is_primary;
create index booking_guests_booking_id_idx on public.booking_guests (booking_id);

create table public.booking_documents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  document_type text not null default 'booking_confirmation'
    check (document_type = 'booking_confirmation'),
  version integer not null check (version > 0),
  storage_path text not null check (char_length(storage_path) between 3 and 1024),
  checksum_sha256 text check (checksum_sha256 is null or checksum_sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'ready'
    check (status in ('ready', 'sent', 'superseded')),
  generated_at timestamptz not null default now(),
  sent_at timestamptz,
  created_by uuid references auth.users(id),
  unique (booking_id, version)
);
create index booking_documents_created_by_idx on public.booking_documents (created_by);

create or replace function private.set_booking_confirmation_readiness()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'cancelled'
     and new.services_confirmed_at is not null
     and new.amount_paid >= new.total_amount
  then
    if tg_op = 'INSERT' then
      new.confirmation_ready_at := coalesce(new.confirmation_ready_at, now());
    else
      new.confirmation_ready_at := coalesce(old.confirmation_ready_at, new.confirmation_ready_at, now());
    end if;
  else
    new.confirmation_ready_at := null;
  end if;
  return new;
end;
$$;
revoke all on function private.set_booking_confirmation_readiness() from public, anon, authenticated;

create trigger bookings_set_confirmation_readiness
before insert or update of status, services_confirmed_at, amount_paid, total_amount
on public.bookings
for each row execute function private.set_booking_confirmation_readiness();

-- ---------------------------------------------------------------------------
-- Paymob-ready payment records and webhook idempotency
-- ---------------------------------------------------------------------------

alter table public.payments drop constraint if exists payments_payment_method_check;
alter table public.payments
  add constraint payments_payment_method_check
    check (payment_method in ('cash', 'bank_transfer', 'card_terminal', 'paymob_card', 'other')),
  add column provider text not null default 'manual'
    check (provider in ('manual', 'paymob')),
  add column gateway_status text
    check (gateway_status is null or gateway_status in ('created', 'pending', 'succeeded', 'failed', 'refunded')),
  add column provider_intention_id text,
  add column provider_order_id text,
  add column provider_transaction_id text,
  add column idempotency_key text,
  add column checkout_url text,
  add column provider_data jsonb not null default '{}'::jsonb;

create unique index payments_provider_transaction_key
  on public.payments (provider, provider_transaction_id)
  where provider_transaction_id is not null;
create unique index payments_idempotency_key
  on public.payments (idempotency_key)
  where idempotency_key is not null;
create index payments_provider_order_idx
  on public.payments (provider, provider_order_id)
  where provider_order_id is not null;

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider = 'paymob'),
  provider_event_id text not null,
  provider_transaction_id text,
  hmac_verified boolean not null default false,
  payload jsonb not null,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);
create index payment_webhook_events_transaction_idx
  on public.payment_webhook_events (provider_transaction_id)
  where provider_transaction_id is not null;

-- An issued confirmation is an immutable business record. Payments that
-- contributed to it cannot be edited or deleted in place.
create function private.protect_issued_confirmation_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking_id uuid;
  v_changes_recorded_payment boolean := false;
begin
  if tg_op = 'DELETE' then
    v_booking_id := old.booking_id;
    v_changes_recorded_payment := old.status = 'recorded';
  else
    v_booking_id := new.booking_id;
    v_changes_recorded_payment := old.status = 'recorded' and (
      new.status is distinct from old.status
      or new.amount is distinct from old.amount
      or new.currency is distinct from old.currency
      or new.booking_id is distinct from old.booking_id
    );
  end if;

  if v_changes_recorded_payment
     and exists (
       select 1 from public.bookings booking
       where booking.id = v_booking_id
         and booking.confirmation_issued_at is not null
     )
  then
    raise exception 'An issued confirmation protects its recorded payments; create a correction instead';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.protect_issued_confirmation_payment() from public, anon, authenticated;

create trigger payments_protect_issued_confirmation
before update or delete on public.payments
for each row execute function private.protect_issued_confirmation_payment();

-- Paymob callbacks are handled atomically: dedupe, match, validate, update.
create function private.process_paymob_transaction(
  p_transaction_id text,
  p_order_id text,
  p_merchant_reference text,
  p_amount numeric,
  p_currency text,
  p_success boolean,
  p_pending boolean,
  p_payload jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.payment_webhook_events;
  v_payment public.payments;
  v_currency text := upper(trim(coalesce(p_currency, '')));
begin
  if char_length(trim(coalesce(p_transaction_id, ''))) not between 1 and 160
     or char_length(trim(coalesce(p_order_id, ''))) not between 1 and 160
  then raise exception 'Invalid Paymob transaction reference'; end if;
  if p_amount is null or p_amount <= 0 or v_currency = ''
  then raise exception 'Invalid Paymob transaction amount'; end if;
  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object'
     or pg_column_size(coalesce(p_payload, '{}'::jsonb)) > 1000000
  then raise exception 'Invalid Paymob webhook payload'; end if;

  insert into public.payment_webhook_events(
    provider, provider_event_id, provider_transaction_id,
    hmac_verified, payload, processing_status
  ) values (
    'paymob', trim(p_transaction_id), trim(p_transaction_id),
    true, p_payload, 'received'
  ) on conflict (provider, provider_event_id) do nothing;

  select * into v_event
  from public.payment_webhook_events event
  where event.provider = 'paymob'
    and event.provider_event_id = trim(p_transaction_id)
  for update;

  if v_event.processing_status in ('processed', 'ignored') then
    return 'duplicate';
  end if;

  update public.payment_webhook_events
  set provider_transaction_id = trim(p_transaction_id), hmac_verified = true,
      payload = p_payload, processing_status = 'received',
      error_message = null, processed_at = null
  where id = v_event.id;

  select payment.* into v_payment
  from public.payments payment
  where payment.provider = 'paymob'
    and payment.provider_order_id = trim(p_order_id)
  order by payment.created_at desc
  limit 1
  for update;

  if v_payment.id is null and nullif(trim(coalesce(p_merchant_reference, '')), '') is not null then
    select payment.* into v_payment
    from public.payments payment
    join public.bookings booking on booking.id = payment.booking_id
    where payment.provider = 'paymob'
      and booking.booking_number = trim(p_merchant_reference)
      and payment.gateway_status in ('created', 'pending')
    order by payment.created_at desc
    limit 1
    for update of payment;
  end if;

  if v_payment.id is null then
    update public.payment_webhook_events
    set processing_status = 'ignored',
        error_message = 'No matching Paymob payment attempt', processed_at = now()
    where id = v_event.id;
    return 'ignored';
  end if;

  if v_payment.amount <> round(p_amount, 2) or upper(v_payment.currency) <> v_currency then
    update public.payment_webhook_events
    set processing_status = 'failed',
        error_message = 'Paymob amount or currency mismatch', processed_at = now()
    where id = v_event.id;
    return 'rejected';
  end if;

  if coalesce(p_pending, false) then
    update public.payments
    set gateway_status = 'pending',
        provider_order_id = coalesce(provider_order_id, trim(p_order_id)),
        provider_transaction_id = trim(p_transaction_id),
        provider_data = provider_data || jsonb_build_object('last_webhook', p_payload, 'last_webhook_at', now())
    where id = v_payment.id;
  elsif coalesce(p_success, false) then
    update public.payments
    set status = 'recorded', gateway_status = 'succeeded',
        received_at = coalesce(received_at, now()),
        reference = coalesce(reference, trim(p_transaction_id)),
        provider_order_id = coalesce(provider_order_id, trim(p_order_id)),
        provider_transaction_id = trim(p_transaction_id),
        provider_data = provider_data || jsonb_build_object('last_webhook', p_payload, 'last_webhook_at', now())
    where id = v_payment.id;
  else
    update public.payments
    set status = 'void', gateway_status = 'failed',
        provider_order_id = coalesce(provider_order_id, trim(p_order_id)),
        provider_transaction_id = trim(p_transaction_id),
        provider_data = provider_data || jsonb_build_object('last_webhook', p_payload, 'last_webhook_at', now())
    where id = v_payment.id;
  end if;

  update public.payment_webhook_events
  set processing_status = 'processed', processed_at = now()
  where id = v_event.id;

  return case when coalesce(p_pending, false) then 'pending'
              when coalesce(p_success, false) then 'succeeded'
              else 'failed' end;
end;
$$;
revoke all on function private.process_paymob_transaction(
  text, text, text, numeric, text, boolean, boolean, jsonb
) from public, anon, authenticated;
grant execute on function private.process_paymob_transaction(
  text, text, text, numeric, text, boolean, boolean, jsonb
) to service_role;

create function public.process_paymob_transaction(
  p_transaction_id text,
  p_order_id text,
  p_merchant_reference text,
  p_amount numeric,
  p_currency text,
  p_success boolean,
  p_pending boolean,
  p_payload jsonb
)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.process_paymob_transaction(
    p_transaction_id, p_order_id, p_merchant_reference, p_amount,
    p_currency, p_success, p_pending, p_payload
  );
$$;
revoke all on function public.process_paymob_transaction(
  text, text, text, numeric, text, boolean, boolean, jsonb
) from public, anon, authenticated;
grant execute on function public.process_paymob_transaction(
  text, text, text, numeric, text, boolean, boolean, jsonb
) to service_role;

-- ---------------------------------------------------------------------------
-- Notification consent and transactional outbox
-- ---------------------------------------------------------------------------

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  request_id uuid references public.requests(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'email')),
  event_type text not null check (event_type in ('request_received', 'application_received', 'application_accepted', 'application_rejected', 'payment_received', 'booking_confirmation')),
  recipient text not null check (char_length(trim(recipient)) between 3 and 254),
  template_name text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  external_message_id text,
  delivery_status text check (delivery_status is null or delivery_status in ('accepted', 'sent', 'delivered', 'read', 'failed')),
  delivery_status_at timestamptz,
  last_error text,
  sent_at timestamptz,
  dedupe_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(booking_id, request_id) >= 1)
);
create index notification_outbox_pending_idx
  on public.notification_outbox (available_at, created_at)
  where status = 'pending';
create index notification_outbox_booking_id_idx on public.notification_outbox (booking_id);
create index notification_outbox_request_id_idx on public.notification_outbox (request_id);
create index notification_outbox_external_message_idx
  on public.notification_outbox (external_message_id)
  where external_message_id is not null;

create trigger notification_outbox_set_updated_at
before update on public.notification_outbox
for each row execute function public.set_updated_at();

create function private.claim_notification_outbox(p_limit integer default 10)
returns setof public.notification_outbox
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select outbox.id
    from public.notification_outbox outbox
    where outbox.status = 'pending'
      and outbox.available_at <= now()
    order by outbox.available_at, outbox.created_at
    for update skip locked
    limit least(greatest(coalesce(p_limit, 10), 1), 50)
  )
  update public.notification_outbox outbox
  set status = 'processing',
      attempts = outbox.attempts + 1,
      updated_at = now()
  from candidates
  where outbox.id = candidates.id
  returning outbox.*;
end;
$$;
revoke all on function private.claim_notification_outbox(integer) from public, anon, authenticated;
grant execute on function private.claim_notification_outbox(integer) to service_role;

create function public.claim_notification_outbox(p_limit integer default 10)
returns setof public.notification_outbox
language sql
security invoker
set search_path = ''
as $$ select * from private.claim_notification_outbox(p_limit); $$;
revoke all on function public.claim_notification_outbox(integer) from public, anon, authenticated;
grant execute on function public.claim_notification_outbox(integer) to service_role;

create function private.complete_notification_outbox(
  p_id uuid,
  p_sent boolean,
  p_external_message_id text default null,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notification_outbox outbox
  set status = case
        when p_sent then 'sent'
        when outbox.attempts >= 5 then 'failed'
        else 'pending'
      end,
      external_message_id = case when p_sent then nullif(trim(coalesce(p_external_message_id, '')), '') else outbox.external_message_id end,
      delivery_status = case when p_sent then 'accepted' else outbox.delivery_status end,
      delivery_status_at = case when p_sent then now() else outbox.delivery_status_at end,
      last_error = case when p_sent then null else left(coalesce(p_error, 'Unknown notification error'), 1000) end,
      sent_at = case when p_sent then now() else outbox.sent_at end,
      available_at = case
        when p_sent or outbox.attempts >= 5 then outbox.available_at
        else now() + make_interval(mins => power(2, least(outbox.attempts, 6))::integer)
      end,
      updated_at = now()
  where outbox.id = p_id and outbox.status = 'processing';
end;
$$;
revoke all on function private.complete_notification_outbox(uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function private.complete_notification_outbox(uuid, boolean, text, text) to service_role;

create function public.complete_notification_outbox(
  p_id uuid,
  p_sent boolean,
  p_external_message_id text default null,
  p_error text default null
)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.complete_notification_outbox(p_id, p_sent, p_external_message_id, p_error); $$;
revoke all on function public.complete_notification_outbox(uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.complete_notification_outbox(uuid, boolean, text, text) to service_role;

create function public.record_whatsapp_delivery_status(
  p_external_message_id text,
  p_status text,
  p_status_at timestamptz default now(),
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('sent', 'delivered', 'read', 'failed') then
    raise exception 'Invalid WhatsApp delivery status';
  end if;
  update public.notification_outbox
  set delivery_status = p_status,
      delivery_status_at = coalesce(p_status_at, now()),
      last_error = case when p_status = 'failed' then left(coalesce(p_error, 'WhatsApp delivery failed'), 1000) else last_error end,
      updated_at = now()
  where channel = 'whatsapp'
    and external_message_id = trim(p_external_message_id);
end;
$$;
revoke all on function public.record_whatsapp_delivery_status(text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.record_whatsapp_delivery_status(text, text, timestamptz, text) to service_role;

-- ---------------------------------------------------------------------------
-- Narrow private implementations and public wrappers
-- ---------------------------------------------------------------------------

drop function if exists public.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[]
);
drop function if exists private.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[]
);

create function private.submit_public_request(
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
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_request public.requests;
  v_required text[] := array['booking', 'cancellation', 'refund', 'payment', 'terms', 'etiquette', 'privacy'];
  v_policy public.policies;
  v_trip_id uuid;
  v_event_id uuid;
  v_capacity integer;
  v_seat_enabled boolean := false;
  v_application_required boolean := false;
  v_subject_slug text := nullif(trim(coalesce(p_subject_slug, '')), '');
  v_subject_title text := nullif(trim(coalesce(p_subject_title, '')), '');
  v_external_subject_id text := nullif(trim(coalesce(p_external_subject_id, '')), '');
  v_scheduled_at timestamptz := p_scheduled_at;
  v_seats jsonb := '[]'::jsonb;
  v_selections jsonb := coalesce(p_selections, '{}'::jsonb);
  v_seat_count integer;
begin
  if char_length(trim(coalesce(p_full_name, ''))) not between 2 and 120 then raise exception 'A valid name is required'; end if;
  if char_length(trim(coalesce(p_email, ''))) > 254 or coalesce(p_email, '') !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'A valid email is required'; end if;
  if char_length(trim(coalesce(p_phone, ''))) > 40 then raise exception 'Phone number is too long'; end if;
  if coalesce(p_whatsapp_opt_in, false) and char_length(trim(coalesce(p_phone, ''))) < 6 then raise exception 'A WhatsApp number is required for WhatsApp updates'; end if;
  if char_length(trim(coalesce(p_external_subject_id, ''))) > 120 then raise exception 'Subject reference is too long'; end if;
  if char_length(trim(coalesce(p_subject_slug, ''))) > 160 then raise exception 'Subject slug is too long'; end if;
  if char_length(trim(coalesce(p_subject_title, ''))) > 160 then raise exception 'Subject title is too long'; end if;
  if char_length(trim(coalesce(p_notes, ''))) > 2000 then raise exception 'Notes are too long'; end if;
  if jsonb_typeof(coalesce(p_selections, '{}'::jsonb)) <> 'object' or pg_column_size(coalesce(p_selections, '{}'::jsonb)) > 20000 then raise exception 'Selection details are invalid'; end if;
  if p_guest_count is not null and p_guest_count < 1 then raise exception 'Guest count must be positive'; end if;
  if not v_required <@ coalesce(p_policy_slugs, array[]::text[]) then raise exception 'Required policies must be accepted'; end if;

  if exists (
    select 1
    from unnest(v_required) as required_policy(slug)
    left join public.policies policy on policy.slug = required_policy.slug
    where policy.id is null or not policy.is_active or btrim(policy.body) = ''
  ) then raise exception 'Required policies are not published'; end if;

  if p_request_type = 'trip' and p_product_id is not null then
    select trip.id, trip.capacity, trip.seat_selection_enabled,
           trip.application_required, trip.slug, trip.title, trip.departure_at
      into v_trip_id, v_capacity, v_seat_enabled,
           v_application_required, v_subject_slug, v_subject_title, v_scheduled_at
    from public.trips trip
    where trip.id = p_product_id and trip.is_published;
    if v_trip_id is null then raise exception 'Trip is unavailable'; end if;
    if v_application_required then raise exception 'This trip requires an application'; end if;
    v_external_subject_id := v_trip_id::text;
  elsif p_request_type = 'event' and p_product_id is not null then
    select event.id, event.application_required, event.slug, event.title, event.starts_at
      into v_event_id, v_application_required, v_subject_slug, v_subject_title, v_scheduled_at
    from public.events event
    where event.id = p_product_id and event.is_published;
    if v_event_id is null then raise exception 'Event is unavailable'; end if;
    if v_application_required then raise exception 'This event requires an application'; end if;
    v_external_subject_id := v_event_id::text;
  elsif p_request_type = 'application' and p_product_id is not null then
    select trip.id, trip.capacity, trip.seat_selection_enabled,
           trip.slug, trip.title, trip.departure_at
      into v_trip_id, v_capacity, v_seat_enabled,
           v_subject_slug, v_subject_title, v_scheduled_at
    from public.trips trip
    where trip.id = p_product_id and trip.is_published and trip.application_required;
    if v_trip_id is null then
      select event.id, event.slug, event.title, event.starts_at
        into v_event_id, v_subject_slug, v_subject_title, v_scheduled_at
      from public.events event
      where event.id = p_product_id and event.is_published and event.application_required;
    end if;
    if v_trip_id is null and v_event_id is null then raise exception 'This application is unavailable'; end if;
    v_external_subject_id := coalesce(v_trip_id, v_event_id)::text;
  end if;

  if p_request_type <> 'application' and char_length(coalesce(v_subject_title, '')) not between 2 and 160 then raise exception 'A trip or event reference is required'; end if;
  if p_request_type = 'application' and p_product_id is not null and char_length(coalesce(v_subject_title, '')) not between 2 and 160 then raise exception 'An application reference is required'; end if;

  if v_seat_enabled and v_trip_id is not null then
    if jsonb_typeof(v_selections -> 'seats') = 'array' then
      v_seats := v_selections -> 'seats';
    elsif coalesce(v_selections ->> 'seat', '') ~ '^[0-9]+$' then
      v_seats := jsonb_build_array((v_selections ->> 'seat')::integer);
    end if;

    v_seat_count := jsonb_array_length(v_seats);
    if v_seat_count < 1 then raise exception 'Choose an available seat'; end if;
    if v_seat_count <> coalesce(p_guest_count, 1) then raise exception 'Choose one seat for every guest'; end if;
    if exists (
      select 1 from jsonb_array_elements_text(v_seats) seat(value)
      where not case
        when seat.value ~ '^[0-9]+$'
          then seat.value::integer between 1 and least(coalesce(v_capacity, 80), 80)
        else false
      end
    ) then raise exception 'The selected seat is invalid'; end if;
    if (
      select count(distinct seat.value::integer)
      from jsonb_array_elements_text(v_seats) seat(value)
    ) <> v_seat_count then raise exception 'Choose each seat only once'; end if;
    v_selections := v_selections || jsonb_build_object('seats', v_seats);
  elsif v_trip_id is not null and (
    jsonb_typeof(v_selections -> 'seats') = 'array'
    or coalesce(v_selections ->> 'seat', '') <> ''
  ) then
    raise exception 'Seat selection is not enabled for this trip';
  end if;

  if exists (
    select 1
    from public.requests existing_request
    join public.customers existing_customer on existing_customer.id = existing_request.customer_id
    where existing_customer.email = lower(trim(p_email))
      and existing_request.request_type = p_request_type
      and existing_request.trip_id is not distinct from v_trip_id
      and existing_request.event_id is not distinct from v_event_id
      and existing_request.subject_slug is not distinct from v_subject_slug
      and existing_request.created_at > now() - interval '5 minutes'
  ) then raise exception 'Please wait before submitting the same request again'; end if;

  insert into public.customers(full_name, email, phone, auth_user_id)
  values (trim(p_full_name), lower(trim(p_email)), nullif(trim(coalesce(p_phone, '')), ''), null)
  on conflict (lower(email)) do update set
    email = public.customers.email
  returning id into v_customer_id;

  insert into public.requests(
    request_type, customer_id, trip_id, event_id, external_subject_id,
    subject_slug, subject_title, guest_count, travel_or_event_at, selections,
    notes, whatsapp_opt_in, whatsapp_opted_in_at,
    contact_name, contact_email, contact_phone
  ) values (
    p_request_type, v_customer_id, v_trip_id, v_event_id,
    v_external_subject_id, v_subject_slug, v_subject_title,
    p_guest_count, v_scheduled_at, v_selections,
    nullif(trim(coalesce(p_notes, '')), ''), coalesce(p_whatsapp_opt_in, false),
    case when coalesce(p_whatsapp_opt_in, false) then now() end,
    trim(p_full_name), lower(trim(p_email)), nullif(trim(coalesce(p_phone, '')), '')
  ) returning * into v_request;

  if p_request_type = 'trip'
     and v_seat_enabled
  then
    update public.trip_seat_reservations
    set status = 'expired'
    where trip_id = v_trip_id and status = 'held' and hold_expires_at <= now();

    begin
      insert into public.trip_seat_reservations(
        trip_id, request_id, seat_number, status, hold_expires_at
      )
      select v_trip_id, v_request.id, seat.value::integer,
             'held', now() + interval '30 minutes'
      from jsonb_array_elements_text(v_seats) seat(value);
    exception when unique_violation then
      raise exception 'One of those seats was just taken. Please choose again';
    end;
  end if;

  for v_policy in
    select * from public.policies where slug = any(v_required) and is_active
  loop
    insert into public.policy_acceptances(policy_id, policy_version, customer_id, request_id)
    values (v_policy.id, v_policy.version, v_customer_id, v_request.id);
  end loop;

  if (select count(*) from public.policy_acceptances where request_id = v_request.id) <> cardinality(v_required) then
    raise exception 'A required policy is not active';
  end if;

  return query select v_request.id, v_request.request_number;
end;
$$;

revoke all on function private.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[], boolean
) from public, anon, authenticated;
grant execute on function private.submit_public_request(
  public.pi_request_type, uuid, text, text, text, text, text, text,
  integer, timestamptz, jsonb, text, text[], boolean
) to anon, authenticated;

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
    p_request_type, p_product_id, p_external_subject_id, p_subject_slug,
    p_subject_title, p_full_name, p_email, p_phone, p_guest_count,
    p_scheduled_at, p_selections, p_notes, p_policy_slugs, p_whatsapp_opt_in
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

create or replace function public.next_pi_booking_number()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'PI-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.pi_booking_number_seq')::text, 5, '0');
$$;

create or replace function private.convert_request_to_booking(
  p_request_id uuid,
  p_total_amount numeric,
  p_note text default null
)
returns table (id uuid, booking_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.requests;
  v_booking public.bookings;
  v_booking_type public.pi_booking_type;
  v_seat_enabled boolean := false;
  v_capacity integer;
  v_seats jsonb := '[]'::jsonb;
  v_seat_count integer;
  v_seat integer;
begin
  if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
  if p_total_amount is null or p_total_amount < 0 then raise exception 'A valid total amount is required'; end if;
  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then raise exception 'Request not found'; end if;
  if v_request.status not in ('accepted', 'confirmed') then raise exception 'Accept the request before creating a booking'; end if;

  if v_request.trip_id is not null then
    v_booking_type := 'trip';
    select trip.seat_selection_enabled, trip.capacity
      into v_seat_enabled, v_capacity
    from public.trips trip
    where trip.id = v_request.trip_id;
  elsif v_request.event_id is not null then
    v_booking_type := 'event';
  else
    raise exception 'Link the application to a trip or event before creating a booking';
  end if;

  select * into v_booking from public.bookings where request_id = p_request_id;
  if v_booking.id is null then
    insert into public.bookings(
      request_id, customer_id, booking_type, status, trip_id, event_id,
      scheduled_at, guest_count, selections, total_amount, notes, updated_by
    ) values (
      v_request.id, v_request.customer_id, v_booking_type, 'pending',
      v_request.trip_id, v_request.event_id, v_request.travel_or_event_at,
      coalesce(v_request.guest_count, 1), v_request.selections, p_total_amount,
      nullif(trim(coalesce(p_note, '')), ''), auth.uid()
    ) returning * into v_booking;

    insert into public.booking_guests(booking_id, full_name, is_primary)
    values (v_booking.id, v_request.contact_name, true);

    insert into public.policy_acceptances(policy_id, policy_version, customer_id, booking_id)
      select policy_id, policy_version, customer_id, v_booking.id
      from public.policy_acceptances
      where request_id = v_request.id;

    if v_booking_type = 'trip' and v_seat_enabled then
      if jsonb_typeof(v_request.selections -> 'seats') = 'array' then
        v_seats := v_request.selections -> 'seats';
      elsif coalesce(v_request.selections ->> 'seat', '') ~ '^[0-9]+$' then
        v_seats := jsonb_build_array((v_request.selections ->> 'seat')::integer);
      end if;
      v_seat_count := jsonb_array_length(v_seats);
      if v_seat_count <> coalesce(v_request.guest_count, 1) then
        raise exception 'Choose one valid seat for every guest';
      end if;
      if exists (
        select 1 from jsonb_array_elements_text(v_seats) seat(value)
        where not case
          when seat.value ~ '^[0-9]+$'
            then seat.value::integer between 1 and least(coalesce(v_capacity, 80), 80)
          else false
        end
      ) then raise exception 'The requested seat is invalid'; end if;

      update public.trip_seat_reservations
      set status = 'expired'
      where trip_id = v_request.trip_id and status = 'held' and hold_expires_at <= now();

      begin
        for v_seat in
          select seat.value::integer
          from jsonb_array_elements_text(v_seats) seat(value)
        loop
          update public.trip_seat_reservations
          set status = 'reserved', booking_id = v_booking.id, hold_expires_at = null
          where request_id = v_request.id and seat_number = v_seat;

          if not found then
            insert into public.trip_seat_reservations(
              trip_id, request_id, booking_id, seat_number, status, hold_expires_at
            ) values (
              v_request.trip_id, v_request.id, v_booking.id,
              v_seat, 'reserved', null
            );
          end if;
        end loop;
      exception when unique_violation then
        raise exception 'One or more requested seats are no longer available';
      end;
    end if;
  end if;

  update public.requests
  set status = 'confirmed',
      admin_note = coalesce(nullif(trim(coalesce(p_note, '')), ''), admin_note),
      updated_by = auth.uid()
  where id = v_request.id;

  return query select v_booking.id, v_booking.booking_number;
end;
$$;

create or replace function private.sync_request_seat_reservation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'rejected' then
    update public.trip_seat_reservations
    set status = 'released', hold_expires_at = null
    where request_id = new.id and status = 'held';
  elsif new.status = 'accepted' then
    update public.trip_seat_reservations
    set hold_expires_at = now() + interval '48 hours'
    where request_id = new.id and status = 'held';
  end if;
  return new;
end;
$$;
revoke all on function private.sync_request_seat_reservation() from public, anon, authenticated;

create trigger requests_sync_seat_reservation
after update of status on public.requests
for each row
when (old.status is distinct from new.status)
execute function private.sync_request_seat_reservation();

create function private.trip_taken_seats(p_trip_id uuid)
returns table (seat_number integer)
language sql
stable
security definer
set search_path = ''
as $$
  select reservation.seat_number
  from public.trip_seat_reservations reservation
  join public.trips trip on trip.id = reservation.trip_id
  where reservation.trip_id = p_trip_id
    and trip.is_published
    and trip.seat_selection_enabled
    and (
      reservation.status = 'reserved'
      or (reservation.status = 'held' and reservation.hold_expires_at > now())
    )
  order by reservation.seat_number;
$$;
revoke all on function private.trip_taken_seats(uuid) from public, anon, authenticated;
grant execute on function private.trip_taken_seats(uuid) to anon, authenticated;

create function public.trip_taken_seats(p_trip_id uuid)
returns table (seat_number integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.trip_taken_seats(p_trip_id);
$$;
revoke all on function public.trip_taken_seats(uuid) from public, anon, authenticated;
grant execute on function public.trip_taken_seats(uuid) to anon, authenticated;

create function private.mark_booking_services_confirmed(
  p_booking_id uuid,
  p_confirmed boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
  if not p_confirmed and exists (
    select 1 from public.bookings booking
    where booking.id = p_booking_id
      and booking.confirmation_issued_at is not null
  ) then
    raise exception 'Issued confirmation cannot be revoked; issue a correction or cancel the booking';
  end if;
  update public.bookings
  set services_confirmed_at = case when p_confirmed then now() else null end,
      updated_by = auth.uid()
  where id = p_booking_id and status <> 'cancelled';
  if not found then raise exception 'Booking not found or cancelled'; end if;
end;
$$;
revoke all on function private.mark_booking_services_confirmed(uuid, boolean) from public, anon, authenticated;
grant execute on function private.mark_booking_services_confirmed(uuid, boolean) to authenticated;

create function public.mark_booking_services_confirmed(
  p_booking_id uuid,
  p_confirmed boolean default true
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.mark_booking_services_confirmed(p_booking_id, p_confirmed);
$$;
revoke all on function public.mark_booking_services_confirmed(uuid, boolean) from public, anon, authenticated;
grant execute on function public.mark_booking_services_confirmed(uuid, boolean) to authenticated;

create function private.record_booking_confirmation(
  p_booking_id uuid,
  p_storage_path text,
  p_checksum_sha256 text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_document_id uuid;
  v_version integer;
  v_phone text;
  v_opt_in boolean;
begin
  if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
  if char_length(trim(coalesce(p_storage_path, ''))) not between 3 and 1024 then raise exception 'A valid document path is required'; end if;
  if p_checksum_sha256 is not null and p_checksum_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'Invalid checksum'; end if;

  select booking.confirmation_version + 1,
         customer.phone,
         request.whatsapp_opt_in
  into v_version, v_phone, v_opt_in
  from public.bookings booking
  join public.customers customer on customer.id = booking.customer_id
  left join public.requests request on request.id = booking.request_id
  where booking.id = p_booking_id
    and booking.confirmation_ready_at is not null
    and booking.status <> 'cancelled'
  for update of booking;

  if v_version is null then raise exception 'Full payment and confirmed services are required first'; end if;

  update public.booking_documents
  set status = 'superseded'
  where booking_id = p_booking_id and status = 'ready';

  insert into public.booking_documents(
    booking_id, version, storage_path, checksum_sha256, created_by
  ) values (
    p_booking_id, v_version, trim(p_storage_path), p_checksum_sha256, auth.uid()
  ) returning id into v_document_id;

  update public.bookings
  set status = 'confirmed', confirmation_issued_at = now(),
      confirmation_pdf_path = trim(p_storage_path),
      confirmation_version = v_version, updated_by = auth.uid()
  where id = p_booking_id;

  if coalesce(v_opt_in, false) and v_phone is not null then
    insert into public.notification_outbox(
      booking_id, request_id, channel, event_type, recipient, payload, dedupe_key
    )
    select booking.id, booking.request_id, 'whatsapp', 'booking_confirmation',
           v_phone,
           jsonb_build_object(
             'booking_number', booking.booking_number,
             'storage_path', trim(p_storage_path),
             'version', v_version
           ),
           'booking-confirmation:' || booking.id::text || ':' || v_version::text || ':whatsapp'
    from public.bookings booking
    where booking.id = p_booking_id;
  end if;

  return v_document_id;
end;
$$;
revoke all on function private.record_booking_confirmation(uuid, text, text) from public, anon, authenticated;
grant execute on function private.record_booking_confirmation(uuid, text, text) to authenticated;

create function public.record_booking_confirmation(
  p_booking_id uuid,
  p_storage_path text,
  p_checksum_sha256 text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.record_booking_confirmation(p_booking_id, p_storage_path, p_checksum_sha256);
$$;
revoke all on function public.record_booking_confirmation(uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_booking_confirmation(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Privileges and RLS for all new operational tables
-- ---------------------------------------------------------------------------

revoke all on public.trip_seat_reservations, public.booking_guests,
  public.booking_documents, public.payment_webhook_events,
  public.notification_outbox from anon, authenticated;

grant select on public.trip_seat_reservations, public.booking_guests,
  public.booking_documents, public.payment_webhook_events,
  public.notification_outbox to authenticated;

alter table public.trip_seat_reservations enable row level security;
alter table public.booking_guests enable row level security;
alter table public.booking_documents enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.notification_outbox enable row level security;

create policy trip_seat_reservations_admin_select
  on public.trip_seat_reservations for select to authenticated
  using ((select private.is_pi_admin()));
create policy booking_guests_admin_select
  on public.booking_guests for select to authenticated
  using ((select private.is_pi_admin()));
create policy booking_documents_admin_select
  on public.booking_documents for select to authenticated
  using ((select private.is_pi_admin()));
create policy payment_webhook_events_admin_select
  on public.payment_webhook_events for select to authenticated
  using ((select private.is_pi_admin()));
create policy notification_outbox_admin_select
  on public.notification_outbox for select to authenticated
  using ((select private.is_pi_admin()));

-- ---------------------------------------------------------------------------
-- Storage buckets: public catalogue assets, private booking confirmations
-- ---------------------------------------------------------------------------

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'catalog-media', 'catalog-media', true, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'booking-confirmations', 'booking-confirmations', false, 10485760,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists catalog_media_public_read on storage.objects;
create policy catalog_media_public_read
  on storage.objects for select to public
  using (bucket_id = 'catalog-media');

drop policy if exists catalog_media_admin_insert on storage.objects;
create policy catalog_media_admin_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'catalog-media' and (select private.is_pi_admin()));

drop policy if exists catalog_media_admin_update on storage.objects;
create policy catalog_media_admin_update
  on storage.objects for update to authenticated
  using (bucket_id = 'catalog-media' and (select private.is_pi_admin()))
  with check (bucket_id = 'catalog-media' and (select private.is_pi_admin()));

drop policy if exists catalog_media_admin_delete on storage.objects;
create policy catalog_media_admin_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'catalog-media' and (select private.is_pi_admin()));

drop policy if exists booking_confirmations_admin_select on storage.objects;
create policy booking_confirmations_admin_select
  on storage.objects for select to authenticated
  using (bucket_id = 'booking-confirmations' and (select private.is_pi_admin()));

drop policy if exists booking_confirmations_admin_insert on storage.objects;
create policy booking_confirmations_admin_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'booking-confirmations' and (select private.is_pi_admin()));

drop policy if exists booking_confirmations_admin_update on storage.objects;
create policy booking_confirmations_admin_update
  on storage.objects for update to authenticated
  using (bucket_id = 'booking-confirmations' and (select private.is_pi_admin()))
  with check (bucket_id = 'booking-confirmations' and (select private.is_pi_admin()));

drop policy if exists booking_confirmations_admin_delete on storage.objects;
create policy booking_confirmations_admin_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'booking-confirmations' and (select private.is_pi_admin()));

comment on column public.trips.application_required is
  'Independent application gate. It does not imply or enable seat selection.';
comment on column public.trips.seat_selection_enabled is
  'Independent seat-selection switch. It does not imply an application.';
comment on column public.requests.whatsapp_opt_in is
  'Explicit consent to send the final Booking Confirmation on WhatsApp; separate from policy acceptance.';
comment on table public.notification_outbox is
  'Idempotent transactional messages awaiting an approved provider integration.';
