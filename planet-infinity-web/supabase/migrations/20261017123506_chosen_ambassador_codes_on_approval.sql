-- The owner chooses the exact code. Keep the legacy parameter name for API compatibility.
create or replace function private.review_campus_application(p_id uuid,p_approve boolean,p_prefix text)
returns uuid language plpgsql security definer set search_path='' as $$
declare application public.campus_ambassador_applications; ambassador uuid;
begin
 if not private.is_pi_admin() then raise exception 'Not authorized'; end if;
 select * into application from public.campus_ambassador_applications where id=p_id for update;
 if application.id is null then raise exception 'Application not found'; end if;
 if application.status='approved' then return application.ambassador_id; end if;
 if p_approve then
  if p_prefix is null or upper(btrim(p_prefix)) !~ '^[A-Z0-9-]{3,24}$' then raise exception 'Choose a unique ambassador code such as FOFA-D1'; end if;
  ambassador:=private.save_campus_ambassador(null,application.event_id,application.full_name,application.university,application.email,application.phone,p_prefix,true,null);
 end if;
 update public.campus_ambassador_applications set status=case when p_approve then 'approved' else 'rejected' end,ambassador_id=ambassador,reviewed_by=auth.uid(),reviewed_at=now() where id=application.id;
 insert into public.campus_audit_log(actor_id,action,record_id,details) values(auth.uid(),'review_application',application.id::text,jsonb_build_object('approved',p_approve,'ambassador',ambassador));
 return ambassador;
end $$;
