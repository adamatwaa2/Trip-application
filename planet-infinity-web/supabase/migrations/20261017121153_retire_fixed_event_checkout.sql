-- Release step: apply only after the campus checkout deployment is ready.
-- The immutable private copy remains available to the new atomic checkout.
create or replace function public.submit_public_event_booking(
 p_event_id uuid,p_submission_id uuid,p_email text,p_guests jsonb,
 p_payment_method text,p_payment_proof jsonb,p_terms_accepted boolean
) returns table(booking_number text,payment_token uuid)
language plpgsql set search_path='' as $$
begin raise exception 'Please refresh event checkout to reserve the current ticket price'; end $$;
revoke all on function public.submit_public_event_booking(uuid,uuid,text,jsonb,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.submit_public_event_booking(uuid,uuid,text,jsonb,text,jsonb,boolean) to service_role;
do $$ begin
 if to_regprocedure('public.submit_public_event_booking_fofa(uuid,uuid,text,jsonb,text,jsonb,boolean,text)') is not null then
  revoke all on function public.submit_public_event_booking_fofa(uuid,uuid,text,jsonb,text,jsonb,boolean,text) from public,anon,authenticated,service_role;
 end if;
end $$;
update public.policies set
 body=replace(body,
 'The current Halloween Early Bird ticket is 1,000 EGP plus a 35 EGP booking fee per ticket. The total is 1,035 EGP per ticket. Early Bird availability is very limited. Mandatory fees are shown before payment.',
 'Early Bird tickets are limited. Ticket prices increase as inventory is committed. A booking crossing a price tier includes the applicable price for each ticket. Any valid code discount applies to tickets only; booking fees are shown separately. The exact total is reserved before payment and saved with the booking. All mandatory fees are shown before payment.'),
 version='events-2026-10-17-campus'
where slug='events-payment' and body like '%The current Halloween Early Bird ticket is 1,000 EGP plus a 35 EGP booking fee per ticket.%';
