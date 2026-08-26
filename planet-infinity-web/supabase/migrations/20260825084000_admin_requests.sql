-- Planet Infinity Web: first operational schema.
-- Apply this migration only to the NEW `planet-infinity-web` Supabase project.
-- It creates no public sign-up path, no service-role workflow, and no payment gateway.

create extension if not exists pgcrypto with schema extensions;

create type public.pi_request_type as enum ('trip', 'event', 'application');
create type public.pi_status as enum ('pending', 'accepted', 'rejected', 'confirmed');
create type public.pi_booking_type as enum ('trip', 'event');
create type public.pi_booking_status as enum ('pending', 'confirmed', 'cancelled');
create type public.pi_payment_status as enum ('pending', 'recorded', 'void');

create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role = 'admin'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  email text not null check (email = lower(email) and char_length(email) between 3 and 254),
  phone text check (phone is null or char_length(phone) <= 40),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index customers_email_lower_key on public.customers (lower(email));

-- Trips and events are separate first-class content types. Variable lists are
-- kept as JSON only where a relational table would not add a useful query path.
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 2 and 160),
  short_description text not null default '',
  description text not null default '',
  destination text,
  duration_label text,
  departure_at timestamptz,
  meeting_point text,
  price_egp numeric(12,2) check (price_egp is null or price_egp >= 0),
  capacity integer check (capacity is null or capacity > 0),
  booking_mode text not null default 'request' check (booking_mode in ('booking', 'request', 'application')),
  is_published boolean not null default false,
  is_featured boolean not null default false,
  media jsonb not null default '{}'::jsonb,
  inclusions jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  itinerary jsonb not null default '[]'::jsonb,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 2 and 160),
  short_description text not null default '',
  description text not null default '',
  category text,
  venue text,
  starts_at timestamptz,
  ends_at timestamptz,
  price_egp numeric(12,2) check (price_egp is null or price_egp >= 0),
  capacity integer check (capacity is null or capacity > 0),
  booking_mode text not null default 'booking' check (booking_mode in ('booking', 'request', 'application')),
  is_published boolean not null default false,
  is_featured boolean not null default false,
  media jsonb not null default '{}'::jsonb,
  ticket_options jsonb not null default '[]'::jsonb,
  inclusions jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

-- Legal text is intentionally blank/draft until approved copy is supplied.
create table public.policies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('booking', 'cancellation', 'refund', 'payment', 'terms', 'privacy')),
  title text not null,
  version text not null,
  body text not null default '',
  is_active boolean not null default true,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.policies (slug, title, version, body) values
  ('booking', 'Booking Policy', 'draft-1', ''),
  ('cancellation', 'Cancellation Policy', 'draft-1', ''),
  ('refund', 'Refund Policy', 'draft-1', ''),
  ('payment', 'Payment Policy', 'draft-1', ''),
  ('terms', 'Terms & Conditions', 'draft-1', ''),
  ('privacy', 'Privacy Policy', 'draft-1', '');

create sequence public.pi_request_number_seq;
create sequence public.pi_booking_number_seq;

create or replace function public.next_pi_request_number()
returns text language sql volatile set search_path = public as $$
  select 'PI-R-' || lpad(nextval('public.pi_request_number_seq')::text, 6, '0');
$$;

create or replace function public.next_pi_booking_number()
returns text language sql volatile set search_path = public as $$
  select 'PI-B-' || lpad(nextval('public.pi_booking_number_seq')::text, 6, '0');
$$;

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique default public.next_pi_request_number(),
  request_type public.pi_request_type not null,
  status public.pi_status not null default 'pending',
  customer_id uuid not null references public.customers(id) on delete restrict,
  trip_id uuid references public.trips(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  external_subject_id text,
  subject_slug text,
  subject_title text,
  travel_or_event_at timestamptz,
  guest_count integer check (guest_count is null or guest_count > 0),
  selections jsonb not null default '{}'::jsonb,
  notes text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  check (
    (request_type = 'trip' and event_id is null)
    or (request_type = 'event' and trip_id is null)
    or (request_type = 'application' and trip_id is null and event_id is null)
  )
);

create table public.request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  from_status public.pi_status,
  to_status public.pi_status not null,
  note text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique default public.next_pi_booking_number(),
  request_id uuid unique references public.requests(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  booking_type public.pi_booking_type not null,
  status public.pi_booking_status not null default 'pending',
  trip_id uuid references public.trips(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  scheduled_at timestamptz,
  guest_count integer not null check (guest_count > 0),
  selections jsonb not null default '{}'::jsonb,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  currency text not null default 'EGP' check (currency = 'EGP'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  check ((booking_type = 'trip' and event_id is null) or (booking_type = 'event' and trip_id is null))
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'EGP' check (currency = 'EGP'),
  payment_method text not null check (payment_method in ('cash', 'bank_transfer', 'card_terminal', 'other')),
  status public.pi_payment_status not null default 'pending',
  received_at timestamptz,
  reference text,
  notes text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One acceptance records the exact policy/version that applied at that time.
create table public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete restrict,
  policy_version text not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  request_id uuid references public.requests(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  accepted_at timestamptz not null default now(),
  check (num_nonnulls(request_id, booking_id) = 1)
);
create unique index policy_acceptances_request_policy_key on public.policy_acceptances (request_id, policy_id) where request_id is not null;
create unique index policy_acceptances_booking_policy_key on public.policy_acceptances (booking_id, policy_id) where booking_id is not null;

create index requests_status_created_at_idx on public.requests(status, created_at desc);
create index requests_customer_created_at_idx on public.requests(customer_id, created_at desc);
create index requests_trip_created_at_idx on public.requests(trip_id, created_at desc) where trip_id is not null;
create index requests_event_created_at_idx on public.requests(event_id, created_at desc) where event_id is not null;
create index request_status_history_request_id_idx on public.request_status_history(request_id, created_at desc);
create index bookings_customer_created_at_idx on public.bookings(customer_id, created_at desc);
create index bookings_status_scheduled_at_idx on public.bookings(status, scheduled_at desc);
create index payments_booking_created_at_idx on public.payments(booking_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.is_pi_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where id = auth.uid() and role = 'admin' and is_active);
$$;

create or replace function public.record_request_status_history()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.request_status_history(request_id, to_status, note, changed_by)
    values (new.id, new.status, 'Request submitted', auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.request_status_history(request_id, from_status, to_status, note, changed_by)
    values (new.id, old.status, new.status, new.admin_note, auth.uid());
  end if;
  return new;
end;
$$;

create or replace function public.recalculate_booking_paid_amount()
returns trigger language plpgsql security definer set search_path = public as $$
declare target_booking_id uuid;
begin
  if tg_op = 'DELETE' then target_booking_id := old.booking_id; else target_booking_id := new.booking_id; end if;
  update public.bookings
  set amount_paid = coalesce((select sum(amount) from public.payments where booking_id = target_booking_id and status = 'recorded'), 0),
      updated_at = now()
  where id = target_booking_id;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger admin_users_set_updated_at before update on public.admin_users for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger trips_set_updated_at before update on public.trips for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();
create trigger policies_set_updated_at before update on public.policies for each row execute function public.set_updated_at();
create trigger requests_set_updated_at before update on public.requests for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger requests_record_status_history after insert or update of status on public.requests for each row execute function public.record_request_status_history();
create trigger payments_recalculate_booking after insert or update or delete on public.payments for each row execute function public.recalculate_booking_paid_amount();

-- Narrow public intake. SECURITY DEFINER is necessary because public visitors
-- may create requests without direct table privileges; every input is checked,
-- it has a fixed search path, and it returns only the new reference.
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
  p_policy_slugs text[]
)
returns table (id uuid, request_number text)
language plpgsql security definer set search_path = public as $$
declare
  v_customer_id uuid;
  v_request public.requests;
  v_required text[] := case when p_request_type = 'application'
    then array['terms', 'privacy']
    else array['booking', 'cancellation', 'refund', 'payment', 'terms', 'privacy'] end;
  v_policy public.policies;
begin
  if char_length(trim(coalesce(p_full_name, ''))) not between 2 and 120 then raise exception 'A valid name is required'; end if;
  if char_length(trim(coalesce(p_email, ''))) > 254 or coalesce(p_email, '') !~ '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$' then raise exception 'A valid email is required'; end if;
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
  -- The RPC is intentionally public, so its limits must live here rather
  -- than only in the Next.js form. This is a basic duplicate/spam guard;
  -- a CAPTCHA or edge rate limit can be added when traffic requires it.
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

create or replace function public.update_request_status(p_request_id uuid, p_status public.pi_status, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_current public.pi_status;
begin
  if not public.is_pi_admin() then raise exception 'Not authorized'; end if;
  select status into v_current from public.requests where id = p_request_id for update;
  if v_current is null then raise exception 'Request not found'; end if;
  if not ((v_current = 'pending' and p_status in ('accepted', 'rejected', 'confirmed')) or
          (v_current = 'accepted' and p_status in ('confirmed', 'rejected')) or
          (v_current = p_status)) then raise exception 'Invalid status transition'; end if;
  update public.requests set status = p_status, admin_note = nullif(trim(coalesce(p_note, '')), ''), updated_by = auth.uid() where id = p_request_id;
end;
$$;

create or replace function public.convert_request_to_booking(p_request_id uuid, p_total_amount numeric, p_note text default null)
returns table (id uuid, booking_number text)
language plpgsql security definer set search_path = public as $$
declare v_request public.requests; v_booking public.bookings;
begin
  if not public.is_pi_admin() then raise exception 'Not authorized'; end if;
  if p_total_amount is null or p_total_amount < 0 then raise exception 'A valid total amount is required'; end if;
  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then raise exception 'Request not found'; end if;
  if v_request.request_type = 'application' then raise exception 'Applications cannot become a booking'; end if;
  if v_request.status not in ('accepted', 'confirmed') then raise exception 'Accept the request before creating a booking'; end if;
  select * into v_booking from public.bookings where request_id = p_request_id;
  if v_booking.id is null then
    insert into public.bookings(request_id, customer_id, booking_type, status, trip_id, event_id, scheduled_at, guest_count, selections, total_amount, notes, updated_by)
    values (v_request.id, v_request.customer_id, v_request.request_type::text::public.pi_booking_type, 'confirmed', v_request.trip_id, v_request.event_id,
      v_request.travel_or_event_at, coalesce(v_request.guest_count, 1), v_request.selections, p_total_amount, nullif(trim(coalesce(p_note, '')), ''), auth.uid())
    returning * into v_booking;
    insert into public.policy_acceptances(policy_id, policy_version, customer_id, booking_id)
      select policy_id, policy_version, customer_id, v_booking.id from public.policy_acceptances where request_id = v_request.id;
  end if;
  update public.requests set status = 'confirmed', admin_note = coalesce(nullif(trim(coalesce(p_note, '')), ''), admin_note), updated_by = auth.uid() where id = v_request.id;
  return query select v_booking.id, v_booking.booking_number;
end;
$$;

create or replace function public.record_manual_payment(
  p_booking_id uuid, p_amount numeric, p_method text, p_status public.pi_payment_status,
  p_received_at timestamptz default null, p_reference text default null, p_notes text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_payment_id uuid;
begin
  if not public.is_pi_admin() then raise exception 'Not authorized'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'A positive amount is required'; end if;
  if p_method not in ('cash', 'bank_transfer', 'card_terminal', 'other') then raise exception 'Invalid payment method'; end if;
  if not exists (select 1 from public.bookings where id = p_booking_id) then raise exception 'Booking not found'; end if;
  insert into public.payments(booking_id, amount, payment_method, status, received_at, reference, notes, recorded_by)
  values (p_booking_id, p_amount, p_method, p_status, p_received_at, nullif(trim(coalesce(p_reference, '')), ''), nullif(trim(coalesce(p_notes, '')), ''), auth.uid())
  returning id into v_payment_id;
  return v_payment_id;
end;
$$;

-- Lock down every table in the exposed schema. Public product/policy reads use
-- explicit select policies; all operational data is accessed only by its owner
-- or an approved administrator.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
grant usage on schema public to anon, authenticated;

grant select on public.trips, public.events, public.policies to anon, authenticated;
grant select on public.admin_users, public.customers, public.requests, public.request_status_history, public.bookings, public.payments, public.policy_acceptances to authenticated;
grant insert, update, delete on public.trips, public.events, public.policies, public.admin_users to authenticated;
grant execute on function public.submit_public_request(public.pi_request_type, uuid, text, text, text, text, text, text, integer, timestamptz, jsonb, text, text[]) to anon, authenticated;
grant execute on function public.update_request_status(uuid, public.pi_status, text) to authenticated;
grant execute on function public.convert_request_to_booking(uuid, numeric, text) to authenticated;
grant execute on function public.record_manual_payment(uuid, numeric, text, public.pi_payment_status, timestamptz, text, text) to authenticated;
grant execute on function public.is_pi_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.customers enable row level security;
alter table public.trips enable row level security;
alter table public.events enable row level security;
alter table public.policies enable row level security;
alter table public.requests enable row level security;
alter table public.request_status_history enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.policy_acceptances enable row level security;

create policy admin_users_select on public.admin_users for select to authenticated using (id = auth.uid() or public.is_pi_admin());
create policy admin_users_insert on public.admin_users for insert to authenticated with check (public.is_pi_admin());
create policy admin_users_update on public.admin_users for update to authenticated using (public.is_pi_admin()) with check (public.is_pi_admin());
create policy admin_users_delete on public.admin_users for delete to authenticated using (public.is_pi_admin());
create policy customers_select on public.customers for select to authenticated using (auth_user_id = auth.uid() or public.is_pi_admin());
create policy trips_anon_read on public.trips for select to anon using (is_published);
create policy trips_authenticated_read on public.trips for select to authenticated using (is_published or public.is_pi_admin());
create policy trips_admin_insert on public.trips for insert to authenticated with check (public.is_pi_admin());
create policy trips_admin_update on public.trips for update to authenticated using (public.is_pi_admin()) with check (public.is_pi_admin());
create policy trips_admin_delete on public.trips for delete to authenticated using (public.is_pi_admin());
create policy events_anon_read on public.events for select to anon using (is_published);
create policy events_authenticated_read on public.events for select to authenticated using (is_published or public.is_pi_admin());
create policy events_admin_insert on public.events for insert to authenticated with check (public.is_pi_admin());
create policy events_admin_update on public.events for update to authenticated using (public.is_pi_admin()) with check (public.is_pi_admin());
create policy events_admin_delete on public.events for delete to authenticated using (public.is_pi_admin());
create policy policies_anon_read on public.policies for select to anon using (is_active);
create policy policies_authenticated_read on public.policies for select to authenticated using (is_active or public.is_pi_admin());
create policy policies_admin_insert on public.policies for insert to authenticated with check (public.is_pi_admin());
create policy policies_admin_update on public.policies for update to authenticated using (public.is_pi_admin()) with check (public.is_pi_admin());
create policy policies_admin_delete on public.policies for delete to authenticated using (public.is_pi_admin());
create policy requests_select on public.requests for select to authenticated using (public.is_pi_admin() or customer_id in (select id from public.customers where auth_user_id = auth.uid()));
create policy request_history_select on public.request_status_history for select to authenticated using (public.is_pi_admin() or request_id in (select id from public.requests where customer_id in (select id from public.customers where auth_user_id = auth.uid())));
create policy bookings_select on public.bookings for select to authenticated using (public.is_pi_admin() or customer_id in (select id from public.customers where auth_user_id = auth.uid()));
create policy payments_select on public.payments for select to authenticated using (public.is_pi_admin() or booking_id in (select id from public.bookings where customer_id in (select id from public.customers where auth_user_id = auth.uid())));
create policy policy_acceptances_select on public.policy_acceptances for select to authenticated using (public.is_pi_admin() or customer_id in (select id from public.customers where auth_user_id = auth.uid()));

-- Bootstrap after applying: create the intended admin in Supabase Auth, then
-- insert only that user's UUID into public.admin_users in the SQL editor.
-- Do not add a trigger that turns every Auth user into an administrator.
