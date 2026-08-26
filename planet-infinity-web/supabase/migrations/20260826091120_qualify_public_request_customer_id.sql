-- Qualify the customer row identifier because the function's TABLE return
-- column is also named `id`; PostgreSQL otherwise treats `returning id` as
-- ambiguous and aborts every valid public booking request.
create or replace function private.submit_public_request(
  p_request_type public.pi_request_type,
  p_product_id uuid,
  p_external_subject_id text,
  p_subject_slug text,
  p_subject_title text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_guest_count integer,
  p_scheduled_at timestamptz,
  p_selections jsonb,
  p_notes text,
  p_policy_slugs text[],
  p_whatsapp_opt_in boolean default false
)
returns table (id uuid, request_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_request public.requests;
  v_required text[] := array['booking', 'cancellation', 'refund', 'payment', 'terms', 'etiquette', 'privacy'];
  v_policy public.policies;
  v_trip_id uuid;
  v_event_id uuid;
  v_capacity integer;
  v_seat_enabled boolean := false;
  v_application_required boolean := false;
  v_subject_slug text := nullif(trim(coalesce(p_subject_slug, '')), '');
  v_subject_title text := nullif(trim(coalesce(p_subject_title, '')), '');
  v_external_subject_id text := nullif(trim(coalesce(p_external_subject_id, '')), '');
  v_scheduled_at timestamptz := p_scheduled_at;
  v_seats jsonb := '[]'::jsonb;
  v_selections jsonb := coalesce(p_selections, '{}'::jsonb);
  v_seat_count integer;
begin
  if char_length(trim(coalesce(p_full_name, ''))) not between 2 and 120 then raise exception 'A valid name is required'; end if;
  if char_length(trim(coalesce(p_email, ''))) > 254 or coalesce(p_email, '') !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'A valid email is required'; end if;
  if char_length(trim(coalesce(p_phone, ''))) > 40 then raise exception 'Phone number is too long'; end if;
  if coalesce(p_whatsapp_opt_in, false) and char_length(trim(coalesce(p_phone, ''))) < 6 then raise exception 'A WhatsApp number is required for WhatsApp updates'; end if;
  if char_length(trim(coalesce(p_external_subject_id, ''))) > 120 then raise exception 'Subject reference is too long'; end if;
  if char_length(trim(coalesce(p_subject_slug, ''))) > 160 then raise exception 'Subject slug is too long'; end if;
  if char_length(trim(coalesce(p_subject_title, ''))) > 160 then raise exception 'Subject title is too long'; end if;
  if char_length(trim(coalesce(p_notes, ''))) > 2000 then raise exception 'Notes are too long'; end if;
  if jsonb_typeof(coalesce(p_selections, '{}'::jsonb)) <> 'object' or pg_column_size(coalesce(p_selections, '{}'::jsonb)) > 20000 then raise exception 'Selection details are invalid'; end if;
  if p_guest_count is not null and p_guest_count < 1 then raise exception 'Guest count must be positive'; end if;
  if not v_required <@ coalesce(p_policy_slugs, array[]::text[]) then raise exception 'Required policies must be accepted'; end if;

  if exists (
    select 1
    from unnest(v_required) as required_policy(slug)
    left join public.policies policy on policy.slug = required_policy.slug
    where policy.id is null or not policy.is_active or btrim(policy.body) = ''
  ) then raise exception 'Required policies are not published'; end if;

  if p_request_type = 'trip' and p_product_id is not null then
    select trip.id, trip.capacity, trip.seat_selection_enabled,
           trip.application_required, trip.slug, trip.title, trip.departure_at
      into v_trip_id, v_capacity, v_seat_enabled,
           v_application_required, v_subject_slug, v_subject_title, v_scheduled_at
    from public.trips trip
    where trip.id = p_product_id and trip.is_published;
    if v_trip_id is null then raise exception 'Trip is unavailable'; end if;
    if v_application_required then raise exception 'This trip requires an application'; end if;
    v_external_subject_id := v_trip_id::text;
  elsif p_request_type = 'event' and p_product_id is not null then
    select event.id, event.application_required, event.slug, event.title, event.starts_at
      into v_event_id, v_application_required, v_subject_slug, v_subject_title, v_scheduled_at
    from public.events event
    where event.id = p_product_id and event.is_published;
    if v_event_id is null then raise exception 'Event is unavailable'; end if;
    if v_application_required then raise exception 'This event requires an application'; end if;
    v_external_subject_id := v_event_id::text;
  elsif p_request_type = 'application' and p_product_id is not null then
    select trip.id, trip.capacity, trip.seat_selection_enabled,
           trip.slug, trip.title, trip.departure_at
      into v_trip_id, v_capacity, v_seat_enabled,
           v_subject_slug, v_subject_title, v_scheduled_at
    from public.trips trip
    where trip.id = p_product_id and trip.is_published and trip.application_required;
    if v_trip_id is null then
      select event.id, event.slug, event.title, event.starts_at
        into v_event_id, v_subject_slug, v_subject_title, v_scheduled_at
      from public.events event
      where event.id = p_product_id and event.is_published and event.application_required;
    end if;
    if v_trip_id is null and v_event_id is null then raise exception 'This application is unavailable'; end if;
    v_external_subject_id := coalesce(v_trip_id, v_event_id)::text;
  end if;

  if p_request_type <> 'application' and char_length(coalesce(v_subject_title, '')) not between 2 and 160 then raise exception 'A trip or event reference is required'; end if;
  if p_request_type = 'application' and p_product_id is not null and char_length(coalesce(v_subject_title, '')) not between 2 and 160 then raise exception 'An application reference is required'; end if;

  if v_seat_enabled and v_trip_id is not null then
    if jsonb_typeof(v_selections -> 'seats') = 'array' then
      v_seats := v_selections -> 'seats';
    elsif coalesce(v_selections ->> 'seat', '') ~ '^[0-9]+$' then
      v_seats := jsonb_build_array((v_selections ->> 'seat')::integer);
    end if;

    v_seat_count := jsonb_array_length(v_seats);
    if v_seat_count < 1 then raise exception 'Choose an available seat'; end if;
    if v_seat_count <> coalesce(p_guest_count, 1) then raise exception 'Choose one seat for every guest'; end if;
    if exists (
      select 1 from jsonb_array_elements_text(v_seats) seat(value)
      where not case
        when seat.value ~ '^[0-9]+$'
          then seat.value::integer between 1 and least(coalesce(v_capacity, 80), 80)
        else false
      end
    ) then raise exception 'The selected seat is invalid'; end if;
    if (
      select count(distinct seat.value::integer)
      from jsonb_array_elements_text(v_seats) seat(value)
    ) <> v_seat_count then raise exception 'Choose each seat only once'; end if;
    v_selections := v_selections || jsonb_build_object('seats', v_seats);
  elsif v_trip_id is not null and (
    jsonb_typeof(v_selections -> 'seats') = 'array'
    or coalesce(v_selections ->> 'seat', '') <> ''
  ) then
    raise exception 'Seat selection is not enabled for this trip';
  end if;

  if exists (
    select 1
    from public.requests existing_request
    join public.customers existing_customer on existing_customer.id = existing_request.customer_id
    where existing_customer.email = lower(trim(p_email))
      and existing_request.request_type = p_request_type
      and existing_request.trip_id is not distinct from v_trip_id
      and existing_request.event_id is not distinct from v_event_id
      and existing_request.subject_slug is not distinct from v_subject_slug
      and existing_request.created_at > now() - interval '5 minutes'
  ) then raise exception 'Please wait before submitting the same request again'; end if;

  insert into public.customers as customer(full_name, email, phone, auth_user_id)
  values (trim(p_full_name), lower(trim(p_email)), nullif(trim(coalesce(p_phone, '')), ''), null)
  on conflict (lower(email)) do update set
    email = customer.email
  returning customer.id into v_customer_id;

  insert into public.requests(
    request_type, customer_id, trip_id, event_id, external_subject_id,
    subject_slug, subject_title, guest_count, travel_or_event_at, selections,
    notes, whatsapp_opt_in, whatsapp_opted_in_at,
    contact_name, contact_email, contact_phone
  ) values (
    p_request_type, v_customer_id, v_trip_id, v_event_id,
    v_external_subject_id, v_subject_slug, v_subject_title,
    p_guest_count, v_scheduled_at, v_selections,
    nullif(trim(coalesce(p_notes, '')), ''), coalesce(p_whatsapp_opt_in, false),
    case when coalesce(p_whatsapp_opt_in, false) then now() end,
    trim(p_full_name), lower(trim(p_email)), nullif(trim(coalesce(p_phone, '')), '')
  ) returning * into v_request;

  if p_request_type = 'trip'
     and v_seat_enabled
  then
    update public.trip_seat_reservations
    set status = 'expired'
    where trip_id = v_trip_id and status = 'held' and hold_expires_at <= now();

    begin
      insert into public.trip_seat_reservations(
        trip_id, request_id, seat_number, status, hold_expires_at
      )
      select v_trip_id, v_request.id, seat.value::integer,
             'held', now() + interval '30 minutes'
      from jsonb_array_elements_text(v_seats) seat(value);
    exception when unique_violation then
      raise exception 'One of those seats was just taken. Please choose again';
    end;
  end if;

  for v_policy in
    select * from public.policies where slug = any(v_required) and is_active
  loop
    insert into public.policy_acceptances(policy_id, policy_version, customer_id, request_id)
    values (v_policy.id, v_policy.version, v_customer_id, v_request.id);
  end loop;

  if (select count(*) from public.policy_acceptances where request_id = v_request.id) <> cardinality(v_required) then
    raise exception 'A required policy is not active';
  end if;

  return query select v_request.id, v_request.request_number;
end;
$$;
