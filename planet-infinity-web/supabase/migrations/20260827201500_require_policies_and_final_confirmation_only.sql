-- Public booking intake is intentionally callable by visitors. Keep all writes
-- inside this validated SECURITY DEFINER boundary and never enqueue a WhatsApp
-- message until an administrator issues the final Booking Confirmation.
create or replace function public.submit_booking_request(
  p_trip_slug text,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_guest_count integer,
  p_custom_answers jsonb default '{}'::jsonb,
  p_total_egp numeric default null,
  p_notes text default null,
  p_payment_method text default null,
  p_payment_proof text default null,
  p_whatsapp_opt_in boolean default false,
  p_accepted_policies boolean default false
)
returns table(reference text, id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips%rowtype;
  v_customer uuid;
  v_request uuid;
  v_number text;
  v_phone text := nullif(btrim(p_contact_phone), '');
  v_email text := lower(nullif(btrim(p_contact_email), ''));
  v_name text := nullif(btrim(p_contact_name), '');
  v_answers jsonb := coalesce(p_custom_answers, '{}'::jsonb);
  v_responses jsonb;
  v_selections jsonb;
begin
  if v_name is null or v_email is null then
    raise exception 'Name and email are required';
  end if;
  if p_guest_count is null or p_guest_count < 1 or p_guest_count > 100 then
    raise exception 'Guest count must be between 1 and 100';
  end if;
  if not p_accepted_policies then
    raise exception 'Required policies must be accepted';
  end if;

  select * into v_trip
  from public.trips
  where slug = p_trip_slug and is_published
  limit 1;
  if not found then raise exception 'Trip not available'; end if;

  if p_payment_proof is not null
     and p_payment_proof !~ '^(pending|incoming)/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
  then
    raise exception 'Invalid payment proof path';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', f ->> 'id',
           'label', f ->> 'label',
           'answer', coalesce(v_answers -> (f ->> 'id'), 'null'::jsonb)
         ) order by ord), '[]'::jsonb)
    into v_responses
  from jsonb_array_elements(coalesce(v_trip.booking_form_fields, '[]'::jsonb))
       with ordinality as t(f, ord);

  v_selections := jsonb_build_object(
    'guestCount', p_guest_count,
    'totalEgp', p_total_egp,
    'bookingMode', coalesce(v_trip.booking_mode::text, 'request'),
    'selections', '[]'::jsonb,
    'customAnswers', v_answers,
    'customResponses', v_responses,
    'source', 'intake_form'
  );

  if p_payment_proof is not null or p_payment_method is not null then
    v_selections := v_selections || jsonb_build_object(
      'paymentProof', jsonb_build_object('method', p_payment_method, 'path', p_payment_proof)
    );
  end if;

  select c.id into v_customer
  from public.customers c
  where lower(c.email) = v_email or (v_phone is not null and c.phone = v_phone)
  order by c.created_at
  limit 1;

  if v_customer is null then
    insert into public.customers (full_name, email, phone)
    values (v_name, v_email, v_phone)
    returning customers.id into v_customer;
  else
    update public.customers c
    set full_name = coalesce(nullif(c.full_name, ''), v_name),
        phone = coalesce(c.phone, v_phone),
        updated_at = now()
    where c.id = v_customer;
  end if;

  insert into public.requests (
    request_type, status, customer_id, trip_id, subject_slug, subject_title,
    travel_or_event_at, guest_count, selections, notes,
    contact_name, contact_email, contact_phone, whatsapp_opt_in, whatsapp_opted_in_at
  ) values (
    'trip', 'pending', v_customer, v_trip.id, v_trip.slug, v_trip.title,
    v_trip.departure_at, p_guest_count, v_selections, p_notes,
    v_name, v_email, v_phone, coalesce(p_whatsapp_opt_in, false),
    case when p_whatsapp_opt_in then now() end
  ) returning requests.id, requests.request_number into v_request, v_number;

  insert into public.policy_acceptances (
    policy_id, policy_version, customer_id, request_id, accepted_at
  )
  select p.id, p.version, v_customer, v_request, now()
  from public.policies p
  where p.is_active
  on conflict do nothing;

  return query select v_number, v_request;
end;
$$;

revoke all on function public.submit_booking_request(
  text, text, text, text, integer, jsonb, numeric, text, text, text, boolean, boolean
) from public;

grant execute on function public.submit_booking_request(
  text, text, text, text, integer, jsonb, numeric, text, text, text, boolean, boolean
) to anon, authenticated;
