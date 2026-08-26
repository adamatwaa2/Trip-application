-- Run with: supabase test db
-- These tests validate grants/RLS boundaries without using a service-role key.
begin;
select plan(12);

select ok(not has_table_privilege('anon', 'public.requests', 'select,insert,update,delete'), 'anon cannot directly access requests');
select ok(not has_table_privilege('anon', 'public.bookings', 'select,insert,update,delete'), 'anon cannot directly access bookings');
select ok(not has_table_privilege('anon', 'public.payments', 'select,insert,update,delete'), 'anon cannot directly access payments');
select ok(not has_table_privilege('anon', 'public.customers', 'select,insert,update,delete'), 'anon cannot directly access customers');
select ok(not has_table_privilege('authenticated', 'public.requests', 'insert,update,delete'), 'authenticated users cannot directly mutate requests');
select ok(not has_table_privilege('authenticated', 'public.bookings', 'insert,update,delete'), 'authenticated users cannot directly mutate bookings');
select ok(has_function_privilege('anon', 'public.submit_public_request(public.pi_request_type, uuid, text, text, text, text, text, text, integer, timestamptz, jsonb, text, text[])', 'execute'), 'public intake RPC is the only anon write path');
select ok(not has_function_privilege('anon', 'public.convert_request_to_booking(uuid, numeric, text)', 'execute'), 'anon cannot convert requests');
select ok(not has_function_privilege('anon', 'public.record_manual_payment(uuid, numeric, text, public.pi_payment_status, timestamptz, text, text)', 'execute'), 'anon cannot record payments');
select ok(not has_function_privilege('authenticated', 'public.set_updated_at()', 'execute'), 'trigger helper is not callable');
select ok(not has_function_privilege('authenticated', 'private.recalculate_booking_paid_amount()', 'execute'), 'payment total helper is not callable');
select ok(not has_function_privilege('anon', 'public.is_pi_admin()', 'execute'), 'anon cannot invoke admin helper');

select * from finish();
rollback;
