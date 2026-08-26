drop policy if exists booking_intake_admin_select on public.booking_intake_submissions;
create policy booking_intake_admin_select
  on public.booking_intake_submissions for select to authenticated
  using ((select private.is_pi_admin()));

drop policy if exists booking_intake_admin_update on public.booking_intake_submissions;
create policy booking_intake_admin_update
  on public.booking_intake_submissions for update to authenticated
  using ((select private.is_pi_admin()))
  with check ((select private.is_pi_admin()));
