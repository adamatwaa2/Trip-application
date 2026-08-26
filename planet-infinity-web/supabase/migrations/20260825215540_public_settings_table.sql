create table if not exists public.settings (
  key text primary key,
  value text not null default '',
  label text not null default '',
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists settings_anon_read on public.settings;
create policy settings_anon_read on public.settings
  for select to anon using (is_public);

drop policy if exists settings_auth_read on public.settings;
create policy settings_auth_read on public.settings
  for select to authenticated using (is_public or (select private.is_pi_admin()));

drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write on public.settings
  for all to authenticated
  using ((select private.is_pi_admin()))
  with check ((select private.is_pi_admin()));

insert into public.settings (key, value, label) values
  ('pay_instapay', '01096896247', 'InstaPay number / handle'),
  ('pay_vodafone_cash', '01096896247', 'Vodafone Cash number'),
  ('pay_bank_transfer', '', 'Bank account details'),
  ('whatsapp_number', '201037299464', 'WhatsApp number (international, no +)'),
  ('brand_footer', 'Planet Infinity', 'Footer line on the booking form')
on conflict (key) do update set value = excluded.value, label = excluded.label;
