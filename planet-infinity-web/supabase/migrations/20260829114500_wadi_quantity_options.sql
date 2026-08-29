-- Existing Wadi extras now ask for an exact quantity instead of assuming that
-- every guest wants every selected add-on.

update public.trips trip
set booking_form_fields = (
  select jsonb_agg(
    case
      when field ->> 'id' = 'tunis-add-ons' then jsonb_set(field, '{type}', '"quantity"'::jsonb)
      when field ->> 'id' = 'tent-preference' then jsonb_build_object(
        'id', 'private-tents',
        'label', 'Private double tents',
        'type', 'quantity',
        'required', false,
        'help', 'Choose the number of private double tents required. Standard camping remains included.',
        'options', jsonb_build_array(
          jsonb_build_object('id', 'private-double-tent', 'label', 'Private double tent', 'priceEgp', 450)
        )
      )
      else field
    end
    order by ordinal
  )
  from jsonb_array_elements(coalesce(trip.booking_form_fields, '[]'::jsonb)) with ordinality as fields(field, ordinal)
)
where trip.slug = 'wadi-el-hitan-nocturne';
