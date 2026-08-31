create table public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index admin_push_subscriptions_admin_id_idx on public.admin_push_subscriptions(admin_id);
alter table public.admin_push_subscriptions enable row level security;
revoke all on table public.admin_push_subscriptions from anon, authenticated;
grant all on table public.admin_push_subscriptions to service_role;
