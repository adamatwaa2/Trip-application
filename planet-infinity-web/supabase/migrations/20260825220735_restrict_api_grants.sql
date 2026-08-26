-- Keep Data API grants aligned with the RLS policies instead of relying on
-- Supabase's broad default privileges for newly created public relations.

revoke all privileges on table public.booking_intake_admin from anon, authenticated;
grant select on table public.booking_intake_admin to authenticated;

revoke all privileges on table public.booking_intake_submissions from anon, authenticated;
grant insert on table public.booking_intake_submissions to anon, authenticated;
grant select, update on table public.booking_intake_submissions to authenticated;

revoke all privileges on table public.settings from anon, authenticated;
grant select on table public.settings to anon;
grant select, insert, update, delete on table public.settings to authenticated;
