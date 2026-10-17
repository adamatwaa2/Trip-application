-- Simple influencer enrolment reuses the existing protected partner/commission system.
-- 'Influencer' is an internal registration source, not a university supplied by the user.
create function public.register_influencer(p_event_id uuid,p_name text,p_email text,p_phone text,p_consent boolean,p_tracking_token uuid)
returns uuid language plpgsql set search_path='' as $$
declare existing public.campus_ambassador_applications; candidate text; attempt integer;
begin
 if current_user not in ('service_role','postgres') then raise exception 'Not authorized'; end if;
 if p_consent is distinct from true or p_tracking_token is null then raise exception 'Privacy consent and registration token are required'; end if;
 perform 1 from public.events where id=p_event_id and is_published for update;
 if not found then raise exception 'Registrations are unavailable'; end if;
 select * into existing from public.campus_ambassador_applications where tracking_token=p_tracking_token;
 if existing.id is not null then
  if existing.event_id=p_event_id and existing.email=lower(btrim(p_email)) and existing.university='Influencer' then return existing.tracking_token; end if;
  raise exception 'Registration unavailable';
 end if;
 for attempt in 1..20 loop
  candidate:='INF-'||upper(left(replace(gen_random_uuid()::text,'-',''),4));
  if not exists(select 1 from public.ambassador_codes where event_id=p_event_id and code=candidate) then
   return public.register_campus_leader(p_event_id,p_name,'Influencer',p_email,p_phone,p_consent,'INF',candidate,p_tracking_token);
  end if;
 end loop;
 raise exception 'Could not allocate a code. Please try again';
end $$;
revoke all on function public.register_influencer(uuid,text,text,text,boolean,uuid) from public,anon,authenticated;
grant execute on function public.register_influencer(uuid,text,text,text,boolean,uuid) to service_role;
