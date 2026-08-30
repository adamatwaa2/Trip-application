do $$
declare
  function_definition text;
  fixed_definition text;
begin
  select pg_get_functiondef(p.oid)
  into function_definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'submit_public_trip_booking'
    and pg_get_function_identity_arguments(p.oid) = 'p_trip_id uuid, p_full_name text, p_email text, p_phone text, p_guest_count integer, p_selections jsonb, p_notes text, p_policy_slugs text[], p_whatsapp_opt_in boolean';

  if function_definition is null then
    raise exception 'private.submit_public_trip_booking was not found';
  end if;

  if position('select t.* into trip from public.trips as t where t.id=p_trip_id and t.is_published for update;' in function_definition) > 0 then
    return;
  end if;

  fixed_definition := replace(
    function_definition,
    'select * into trip from public.trips where id=p_trip_id and is_published for update;',
    'select t.* into trip from public.trips as t where t.id=p_trip_id and t.is_published for update;'
  );

  if fixed_definition = function_definition then
    raise exception 'Expected ambiguous trip lookup was not found';
  end if;

  execute fixed_definition;
end;
$$;
