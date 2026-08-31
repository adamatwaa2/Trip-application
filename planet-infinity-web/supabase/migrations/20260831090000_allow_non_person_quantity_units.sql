-- Quantity add-ons can be measured in people, tents, rooms, or another unit.
-- Only person/guest quantities are limited by the number of travelling guests.
create or replace function private.trip_booking_addons_total(
  p_fields jsonb,
  p_answers jsonb,
  p_guest_count integer
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  field jsonb;
  option jsonb;
  answer jsonb;
  quantity integer;
  total numeric := 0;
  unit text;
  maximum integer;
begin
  if jsonb_typeof(coalesce(p_fields, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_answers, '{}'::jsonb)) <> 'object'
     or p_guest_count not between 1 and 80 then
    raise exception 'Invalid custom booking answers';
  end if;

  for field in select value from jsonb_array_elements(p_fields)
  loop
    answer := p_answers -> (field ->> 'id');
    if field ->> 'type' = 'quantity' then
      if answer is not null and jsonb_typeof(answer) <> 'object' then
        raise exception 'Invalid add-on quantities';
      end if;
      unit := lower(coalesce(nullif(btrim(field ->> 'quantityUnit'), ''), 'person'));
      maximum := case when unit in ('person', 'guest') then p_guest_count else 20 end;
      quantity := 0;
      for option in select value from jsonb_array_elements(coalesce(field -> 'options', '[]'::jsonb))
      loop
        if answer ? (option ->> 'id') then
          if (answer ->> (option ->> 'id')) !~ '^[0-9]+$' then raise exception 'Invalid add-on quantity'; end if;
          if (answer ->> (option ->> 'id'))::integer > maximum then
            raise exception 'Add-on quantity exceeds the available % limit', unit;
          end if;
          quantity := quantity + (answer ->> (option ->> 'id'))::integer;
          total := total + coalesce((option ->> 'priceEgp')::numeric, 0) * (answer ->> (option ->> 'id'))::integer;
        end if;
      end loop;
      if coalesce((field ->> 'required')::boolean, false) and quantity = 0 then
        raise exception 'A required trip question is missing';
      end if;
    else
      if coalesce((field ->> 'required')::boolean, false)
         and (answer is null or answer = 'null'::jsonb
           or (jsonb_typeof(answer) = 'string' and btrim(answer #>> '{}') = '')
           or (jsonb_typeof(answer) = 'array' and jsonb_array_length(answer) = 0)) then
        raise exception 'A required trip question is missing';
      end if;
    end if;
  end loop;
  return total;
end;
$$;

revoke all on function private.trip_booking_addons_total(jsonb, jsonb, integer) from public, anon, authenticated;
