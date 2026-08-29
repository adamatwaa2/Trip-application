-- Persistent, admin-only activity feed. These records are created by database
-- triggers so they are not lost when nobody has the admin panel open.
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('booking_created', 'request_created', 'payment_proof_uploaded', 'payment_recorded', 'payment_rejected', 'booking_confirmed', 'booking_cancelled')),
  title text not null,
  body text not null,
  booking_id uuid references public.bookings(id) on delete cascade,
  request_id uuid references public.requests(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_unread_idx
  on public.admin_notifications (created_at desc)
  where read_at is null;
create index if not exists admin_notifications_booking_idx on public.admin_notifications (booking_id, created_at desc);
create index if not exists admin_notifications_request_idx on public.admin_notifications (request_id, created_at desc);

revoke all on public.admin_notifications from public, anon, authenticated;
grant select, update on public.admin_notifications to authenticated;
alter table public.admin_notifications enable row level security;

drop policy if exists admin_notifications_select on public.admin_notifications;
create policy admin_notifications_select on public.admin_notifications
  for select to authenticated using ((select private.is_pi_admin()));
drop policy if exists admin_notifications_update on public.admin_notifications;
create policy admin_notifications_update on public.admin_notifications
  for update to authenticated using ((select private.is_pi_admin())) with check ((select private.is_pi_admin()));

create or replace function private.create_admin_notification(
  p_kind text,
  p_title text,
  p_body text,
  p_booking_id uuid default null,
  p_request_id uuid default null,
  p_payment_id uuid default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_notifications(kind, title, body, booking_id, request_id, payment_id)
  values (p_kind, p_title, p_body, p_booking_id, p_request_id, p_payment_id);
end;
$$;
revoke all on function private.create_admin_notification(text, text, text, uuid, uuid, uuid) from public, anon, authenticated;

create or replace function private.notify_admin_on_booking_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.create_admin_notification('booking_created', 'New booking', 'A new booking is awaiting payment verification.', new.id);
  return new;
end;
$$;

create or replace function private.notify_admin_on_payment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.payment_proof_path is not null then
    perform private.create_admin_notification('payment_proof_uploaded', 'Payment receipt received', 'A customer uploaded a payment receipt for review.', new.booking_id, null, new.id);
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'recorded' then
    perform private.create_admin_notification('payment_recorded', 'Payment verified', 'A payment was recorded successfully.', new.booking_id, null, new.id);
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'void' then
    perform private.create_admin_notification('payment_rejected', 'Payment rejected', 'A payment was marked void and needs follow-up.', new.booking_id, null, new.id);
  end if;
  return new;
end;
$$;

create or replace function private.notify_admin_on_request_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.create_admin_notification('request_created', 'New request', 'A new customer request is ready for review.', null, new.id);
  return new;
end;
$$;

create or replace function private.notify_admin_on_booking_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status and new.status = 'confirmed' then
    perform private.create_admin_notification('booking_confirmed', 'Booking confirmed', 'A booking is now confirmed.', new.id);
  elsif old.status is distinct from new.status and new.status = 'cancelled' then
    perform private.create_admin_notification('booking_cancelled', 'Booking cancelled', 'A booking was cancelled.', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists admin_notifications_booking_insert on public.bookings;
create trigger admin_notifications_booking_insert after insert on public.bookings
  for each row execute function private.notify_admin_on_booking_insert();
drop trigger if exists admin_notifications_payment_change on public.payments;
create trigger admin_notifications_payment_change after insert or update of status on public.payments
  for each row execute function private.notify_admin_on_payment_change();
drop trigger if exists admin_notifications_request_insert on public.requests;
create trigger admin_notifications_request_insert after insert on public.requests
  for each row execute function private.notify_admin_on_request_insert();
drop trigger if exists admin_notifications_booking_status on public.bookings;
create trigger admin_notifications_booking_status after update of status on public.bookings
  for each row execute function private.notify_admin_on_booking_status();

alter table public.admin_notifications replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notifications'
  ) then
    alter publication supabase_realtime add table public.admin_notifications;
  end if;
end;
$$;
