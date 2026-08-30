-- A confirmed booking chooses seats after payment and final confirmation.
-- Each departure may run more than one Hiace, so a seat number is unique only
-- inside its selected vehicle.

alter table public.trip_seat_reservations
  add column if not exists vehicle_id text;

update public.trip_seat_reservations
set vehicle_id = 'hiace-1'
where vehicle_id is null or btrim(vehicle_id) = '';

alter table public.trip_seat_reservations
  alter column vehicle_id set default 'hiace-1',
  alter column vehicle_id set not null,
  add constraint trip_seat_reservations_vehicle_id_check
    check (vehicle_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$') not valid;

alter table public.trip_seat_reservations
  validate constraint trip_seat_reservations_vehicle_id_check;

drop index if exists public.trip_seat_reservations_active_departure_seat_key;
create unique index trip_seat_reservations_active_departure_vehicle_seat_key
  on public.trip_seat_reservations (trip_id, scheduled_at, vehicle_id, seat_number)
  where status in ('held', 'reserved');

drop function if exists public.assign_paid_booking_seats(uuid, integer[]);

create or replace function public.assign_paid_booking_seats(
  p_payment_token uuid,
  p_vehicle_id text,
  p_seats integer[]
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  booking public.bookings;
  trip public.trips;
  vehicle jsonb;
  layout jsonb;
  allowed integer[] := array[]::integer[];
  row jsonb;
  value text;
  vehicle_id text := lower(btrim(coalesce(p_vehicle_id, '')));
begin
  select * into booking from public.bookings where payment_token = p_payment_token for update;
  if booking.id is null or booking.status = 'cancelled' then
    raise exception 'Booking is unavailable';
  end if;
  if booking.amount_paid < booking.total_amount then
    raise exception 'Seat selection unlocks after full payment';
  end if;
  if booking.confirmation_ready_at is null then
    raise exception 'Seat selection unlocks after booking confirmation';
  end if;

  select * into trip from public.trips where id = booking.trip_id for update;
  if trip.id is null or not trip.seat_selection_enabled then
    raise exception 'Seat selection is not enabled for this trip';
  end if;
  if vehicle_id !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Choose a valid vehicle';
  end if;
  if coalesce(array_length(p_seats, 1), 0) <> booking.guest_count
    or (select count(distinct seat) from unnest(p_seats) seat) <> booking.guest_count then
    raise exception 'Choose one different seat for every guest';
  end if;

  if jsonb_typeof(trip.seat_config -> 'vehicles') = 'array'
    and jsonb_array_length(trip.seat_config -> 'vehicles') > 0 then
    select value into vehicle
    from jsonb_array_elements(trip.seat_config -> 'vehicles')
    where value ->> 'id' = vehicle_id
    limit 1;
    if vehicle is null or jsonb_typeof(vehicle -> 'layout') <> 'object' then
      raise exception 'Choose an available vehicle';
    end if;
    layout := vehicle -> 'layout';
  else
    if vehicle_id <> 'hiace-1' then
      raise exception 'Choose an available vehicle';
    end if;
    layout := trip.seat_config -> 'layout';
  end if;

  if jsonb_typeof(layout -> 'rows') <> 'array' then
    raise exception 'Seat map is unavailable';
  end if;
  for row in select value from jsonb_array_elements(layout -> 'rows') loop
    for value in
      select jsonb_array_elements_text(coalesce(row -> 'left', '[]'::jsonb))
      union all
      select jsonb_array_elements_text(coalesce(row -> 'right', '[]'::jsonb))
    loop
      if value ~ '^[0-9]+$' then
        allowed := array_append(allowed, value::integer);
      end if;
    end loop;
  end loop;
  if exists (select 1 from unnest(p_seats) seat where not seat = any(allowed)) then
    raise exception 'Choose an available seat from the map';
  end if;

  delete from public.trip_seat_reservations where booking_id = booking.id;
  begin
    insert into public.trip_seat_reservations(
      trip_id, request_id, booking_id, scheduled_at, vehicle_id,
      seat_number, status, hold_expires_at
    )
    select trip.id, null, booking.id, booking.scheduled_at, vehicle_id,
      seat, 'reserved', null
    from unnest(p_seats) seat;
  exception when unique_violation then
    raise exception 'One of those seats was just taken. Please choose again';
  end;

  update public.bookings
  set selections = jsonb_set(
    jsonb_set(coalesce(selections, '{}'::jsonb), '{seats}', to_jsonb(p_seats), true),
    '{seatVehicleId}', to_jsonb(vehicle_id), true
  ), updated_at = now()
  where id = booking.id;
end;
$$;

revoke all on function public.assign_paid_booking_seats(uuid, text, integer[]) from public, anon, authenticated;
grant execute on function public.assign_paid_booking_seats(uuid, text, integer[]) to service_role;
