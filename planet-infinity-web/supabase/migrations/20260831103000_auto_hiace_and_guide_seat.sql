-- Seat 1 is reserved for the trip guide. A newly needed Hiace is added to the
-- trip's fleet only when the customer reaches the next sequential vehicle.
update public.trips
set seat_config = jsonb_set(
  coalesce(seat_config, '{}'::jsonb),
  '{unavailable}',
  coalesce(
    (
      select jsonb_agg(value)
      from (
        select value from jsonb_array_elements(coalesce(seat_config -> 'unavailable', '[]'::jsonb))
        union
        select to_jsonb(1)
      ) reserved(value)
    ),
    '[1]'::jsonb
  ),
  true
)
where seat_selection_enabled;

create or replace function public.assign_paid_booking_seats(
  p_payment_token uuid,
  p_vehicle_id text,
  p_seats integer[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking public.bookings;
  trip public.trips;
  selected_vehicle jsonb;
  selected_layout jsonb;
  fleet jsonb;
  template_vehicle jsonb;
  allowed_seats integer[] := array[]::integer[];
  unavailable_seats integer[] := array[1];
  layout_row jsonb;
  seat_text text;
  selected_vehicle_id text := lower(btrim(coalesce(p_vehicle_id, '')));
  next_vehicle_id text;
begin
  select b.* into booking from public.bookings b where b.payment_token = p_payment_token for update;
  if booking.id is null or booking.status = 'cancelled' then raise exception 'Booking is unavailable'; end if;
  if booking.amount_paid < booking.total_amount then raise exception 'Seat selection unlocks after full payment'; end if;
  if booking.confirmation_issued_at is null then raise exception 'Seat selection unlocks after the final Booking Confirmation is issued'; end if;
  if selected_vehicle_id !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Choose a valid vehicle'; end if;
  if coalesce(array_length(p_seats, 1), 0) <> booking.guest_count
    or (select count(distinct chosen_seat) from unnest(p_seats) chosen_seat) <> booking.guest_count then
    raise exception 'Choose one different seat for every guest';
  end if;

  select t.* into trip from public.trips t where t.id = booking.trip_id for update;
  if trip.id is null or not trip.seat_selection_enabled then raise exception 'Seat selection is not enabled for this trip'; end if;
  fleet := case when jsonb_typeof(trip.seat_config -> 'vehicles') = 'array' then trip.seat_config -> 'vehicles' else '[]'::jsonb end;

  select item.value into selected_vehicle from jsonb_array_elements(fleet) item(value)
  where item.value ->> 'id' = selected_vehicle_id limit 1;
  if selected_vehicle is null then
    next_vehicle_id := 'hiace-' || (jsonb_array_length(fleet) + 1)::text;
    if selected_vehicle_id <> next_vehicle_id then raise exception 'Choose the next available Hiace'; end if;
    template_vehicle := coalesce(fleet -> 0, '{}'::jsonb);
    selected_layout := coalesce(template_vehicle -> 'layout', trip.seat_config -> 'layout');
    if jsonb_typeof(selected_layout) <> 'object' then raise exception 'Seat map is unavailable'; end if;
    selected_vehicle := jsonb_build_object(
      'id', selected_vehicle_id,
      'label', 'Hiace ' || (jsonb_array_length(fleet) + 1)::text,
      'layout', selected_layout,
      'unavailable', coalesce(template_vehicle -> 'unavailable', trip.seat_config -> 'unavailable', '[1]'::jsonb)
    );
    update public.trips t
    set seat_config = jsonb_set(t.seat_config, '{vehicles}', fleet || jsonb_build_array(selected_vehicle), true), updated_at = now()
    where t.id = trip.id;
  else
    selected_layout := selected_vehicle -> 'layout';
  end if;
  if jsonb_typeof(selected_layout) <> 'object' or jsonb_typeof(selected_layout -> 'rows') <> 'array' then raise exception 'Seat map is unavailable'; end if;

  for seat_text in select value from jsonb_array_elements_text(coalesce(selected_vehicle -> 'unavailable', trip.seat_config -> 'unavailable', '[]'::jsonb)) loop
    if seat_text ~ '^[0-9]+$' then unavailable_seats := array_append(unavailable_seats, seat_text::integer); end if;
  end loop;
  for layout_row in select row_item.item from jsonb_array_elements(selected_layout -> 'rows') row_item(item) loop
    for seat_text in
      select left_seat.item from jsonb_array_elements_text(coalesce(layout_row -> 'left', '[]'::jsonb)) left_seat(item)
      union all
      select right_seat.item from jsonb_array_elements_text(coalesce(layout_row -> 'right', '[]'::jsonb)) right_seat(item)
    loop
      if seat_text ~ '^[0-9]+$' then allowed_seats := array_append(allowed_seats, seat_text::integer); end if;
    end loop;
  end loop;
  if exists (select 1 from unnest(p_seats) chosen_seat where not chosen_seat = any(allowed_seats) or chosen_seat = any(unavailable_seats)) then
    raise exception 'Choose an available seat from the map';
  end if;

  delete from public.trip_seat_reservations reservation where reservation.booking_id = booking.id;
  begin
    insert into public.trip_seat_reservations(trip_id, request_id, booking_id, scheduled_at, vehicle_id, seat_number, status, hold_expires_at)
    select trip.id, null, booking.id, booking.scheduled_at, selected_vehicle_id, chosen_seat, 'reserved', null
    from unnest(p_seats) chosen_seat;
  exception when unique_violation then
    raise exception 'One of those seats was just taken. Please choose again';
  end;
  update public.bookings b
  set selections = jsonb_set(jsonb_set(coalesce(b.selections, '{}'::jsonb), '{seats}', to_jsonb(p_seats), true), '{seatVehicleId}', to_jsonb(selected_vehicle_id), true), updated_at = now()
  where b.id = booking.id;
end;
$$;

revoke all on function public.assign_paid_booking_seats(uuid, text, integer[]) from public, anon, authenticated;
grant execute on function public.assign_paid_booking_seats(uuid, text, integer[]) to service_role;
