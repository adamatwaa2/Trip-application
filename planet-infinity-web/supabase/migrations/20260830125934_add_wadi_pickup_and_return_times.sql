update public.trips
set booking_form_fields = jsonb_build_array(
  jsonb_build_object(
    'id', 'pickup-point',
    'label', 'Pickup point',
    'type', 'select',
    'required', true,
    'help', 'Choose the meeting point you will use. Only this point will appear on your confirmation.',
    'options', jsonb_build_array(
      jsonb_build_object('id', 'abd-el-monam-riyad', 'label', 'Abd El Monam Riyad (Go Bus) · 1:30 PM'),
      jsonb_build_object('id', 'hadayek-el-ahram', 'label', 'Hadayek El Ahram · 2:15 PM')
    )
  )
) || coalesce(booking_form_fields, '[]'::jsonb)
where slug = 'wadi-el-hitan-nocturne'
  and not exists (
    select 1
    from jsonb_array_elements(coalesce(booking_form_fields, '[]'::jsonb)) as field
    where field->>'id' = 'pickup-point'
  );

update public.trips as trip
set options = (
  select jsonb_agg(
    case
      when option_group.value->>'id' = 'departure' then
        jsonb_set(
          option_group.value,
          '{choices}',
          coalesce((
            select jsonb_agg(
              choice.value || case choice.value->>'id'
                when 'wadi-2026-09-10' then jsonb_build_object('returnAt', '2026-09-11T15:15:00+03:00', 'duration', '2 days / 1 night')
                when 'wadi-2026-09-11' then jsonb_build_object('returnAt', '2026-09-12T15:15:00+03:00', 'duration', '2 days / 1 night')
                else '{}'::jsonb
              end
              order by choice.ordinality
            )
            from jsonb_array_elements(option_group.value->'choices') with ordinality as choice(value, ordinality)
          ), '[]'::jsonb)
        )
      else option_group.value
    end
    order by option_group.ordinality
  )
  from jsonb_array_elements(coalesce(trip.options, '[]'::jsonb)) with ordinality as option_group(value, ordinality)
)
where trip.slug = 'wadi-el-hitan-nocturne';
