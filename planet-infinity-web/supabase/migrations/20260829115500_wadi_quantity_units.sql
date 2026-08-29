update public.trips trip
set booking_form_fields = (
  select jsonb_agg(
    case
      when field ->> 'id' = 'private-tents' then field || jsonb_build_object('quantityUnit', 'tent')
      when field ->> 'type' = 'quantity' then field || jsonb_build_object('quantityUnit', 'person')
      else field
    end
    order by ordinal
  )
  from jsonb_array_elements(coalesce(trip.booking_form_fields, '[]'::jsonb)) with ordinality as fields(field, ordinal)
)
where trip.slug = 'wadi-el-hitan-nocturne';
