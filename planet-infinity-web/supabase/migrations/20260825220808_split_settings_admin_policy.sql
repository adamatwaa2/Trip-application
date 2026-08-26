-- Avoid evaluating two permissive SELECT policies for authenticated users.
-- Read access stays in settings_auth_read; admin writes get command-specific policies.

drop policy if exists settings_admin_write on public.settings;

create policy settings_admin_insert
on public.settings
for insert
to authenticated
with check ((select private.is_pi_admin()));

create policy settings_admin_update
on public.settings
for update
to authenticated
using ((select private.is_pi_admin()))
with check ((select private.is_pi_admin()));

create policy settings_admin_delete
on public.settings
for delete
to authenticated
using ((select private.is_pi_admin()));
