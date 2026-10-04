-- Keep Wadi El Hitan checkout totals aligned with the published programme:
-- Egyptian early bird 2,950 EGP; foreign early bird 4,950 EGP; breakfast included.
with corrected as (
  select
    trip.id,
    jsonb_agg(
      case
        when field.value ->> 'id' = 'tunis-add-ons' then
          jsonb_set(
            field.value,
            '{options}',
            coalesce((
              select jsonb_agg(option.value order by option.ordinality)
              from jsonb_array_elements(field.value -> 'options') with ordinality as option(value, ordinality)
              where option.value ->> 'id' <> 'breakfast'
            ), '[]'::jsonb)
          )
        when field.value ->> 'id' = 'foreigner-pricing' then
          jsonb_set(
            field.value,
            '{options}',
            coalesce((
              select jsonb_agg(
                case
                  when option.value ->> 'id' = 'foreigner-early-bird'
                    then jsonb_set(option.value, '{priceEgp}', '2000'::jsonb)
                  else option.value
                end
                order by option.ordinality
              )
              from jsonb_array_elements(field.value -> 'options') with ordinality as option(value, ordinality)
            ), '[]'::jsonb)
          )
        else field.value
      end
      order by field.ordinality
    ) as fields
  from public.trips as trip
  cross join lateral jsonb_array_elements(trip.booking_form_fields) with ordinality as field(value, ordinality)
  where trip.slug = 'wadi-el-hitan-nocturne'
  group by trip.id
)
update public.trips as trip
set
  booking_form_fields = corrected.fields,
  updated_at = now()
from corrected
where trip.id = corrected.id;
