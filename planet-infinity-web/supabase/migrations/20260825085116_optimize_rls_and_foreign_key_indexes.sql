-- Cover every foreign-key column used by joins, deletes, and admin reporting.
create index if not exists bookings_event_id_idx on public.bookings (event_id);
create index if not exists bookings_trip_id_idx on public.bookings (trip_id);
create index if not exists bookings_updated_by_idx on public.bookings (updated_by);
create index if not exists payments_recorded_by_idx on public.payments (recorded_by);
create index if not exists policies_updated_by_idx on public.policies (updated_by);
create index if not exists policy_acceptances_customer_id_idx on public.policy_acceptances (customer_id);
create index if not exists policy_acceptances_policy_id_idx on public.policy_acceptances (policy_id);
create index if not exists request_status_history_changed_by_idx on public.request_status_history (changed_by);
create index if not exists requests_updated_by_idx on public.requests (updated_by);

-- Evaluate the current user and administrator check once per statement instead
-- of once for every row scanned by an RLS policy.
alter policy admin_users_select on public.admin_users
  using ((id = (select auth.uid())) or (select private.is_pi_admin()));
alter policy admin_users_insert on public.admin_users
  with check ((select private.is_pi_admin()));
alter policy admin_users_update on public.admin_users
  using ((select private.is_pi_admin()))
  with check ((select private.is_pi_admin()));
alter policy admin_users_delete on public.admin_users
  using ((select private.is_pi_admin()));

alter policy customers_select on public.customers
  using ((auth_user_id = (select auth.uid())) or (select private.is_pi_admin()));

alter policy trips_authenticated_read on public.trips
  using (is_published or (select private.is_pi_admin()));
alter policy trips_admin_insert on public.trips
  with check ((select private.is_pi_admin()));
alter policy trips_admin_update on public.trips
  using ((select private.is_pi_admin()))
  with check ((select private.is_pi_admin()));
alter policy trips_admin_delete on public.trips
  using ((select private.is_pi_admin()));

alter policy events_authenticated_read on public.events
  using (is_published or (select private.is_pi_admin()));
alter policy events_admin_insert on public.events
  with check ((select private.is_pi_admin()));
alter policy events_admin_update on public.events
  using ((select private.is_pi_admin()))
  with check ((select private.is_pi_admin()));
alter policy events_admin_delete on public.events
  using ((select private.is_pi_admin()));

alter policy policies_authenticated_read on public.policies
  using (is_active or (select private.is_pi_admin()));
alter policy policies_admin_insert on public.policies
  with check ((select private.is_pi_admin()));
alter policy policies_admin_update on public.policies
  using ((select private.is_pi_admin()))
  with check ((select private.is_pi_admin()));
alter policy policies_admin_delete on public.policies
  using ((select private.is_pi_admin()));

alter policy requests_select on public.requests
  using (
    (select private.is_pi_admin())
    or customer_id in (
      select id from public.customers
      where auth_user_id = (select auth.uid())
    )
  );

alter policy request_history_select on public.request_status_history
  using (
    (select private.is_pi_admin())
    or request_id in (
      select r.id
      from public.requests r
      where r.customer_id in (
        select c.id from public.customers c
        where c.auth_user_id = (select auth.uid())
      )
    )
  );

alter policy bookings_select on public.bookings
  using (
    (select private.is_pi_admin())
    or customer_id in (
      select id from public.customers
      where auth_user_id = (select auth.uid())
    )
  );

alter policy payments_select on public.payments
  using (
    (select private.is_pi_admin())
    or booking_id in (
      select b.id
      from public.bookings b
      where b.customer_id in (
        select c.id from public.customers c
        where c.auth_user_id = (select auth.uid())
      )
    )
  );

alter policy policy_acceptances_select on public.policy_acceptances
  using (
    (select private.is_pi_admin())
    or customer_id in (
      select id from public.customers
      where auth_user_id = (select auth.uid())
    )
  );
