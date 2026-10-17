begin;
set local role service_role;
do $$
declare e uuid; token uuid:=gen_random_uuid(); token2 uuid:=gen_random_uuid(); v_email text:='influencer-'||gen_random_uuid()||'@example.test'; app public.campus_ambassador_applications; second public.campus_ambassador_applications; q jsonb; session uuid:=gen_random_uuid(); rejected boolean:=false;
begin
 select id into e from public.events where slug='halloween-party-2026';
 begin perform public.register_influencer(e,'Test Influencer',v_email,'01000000000',false,token);exception when others then rejected:=true;end;
 assert rejected,'Privacy consent is required';
 assert public.register_influencer(e,'Test Influencer',v_email,'01000000000',true,token)=token,'Registration returns private token';
 select * into app from public.campus_ambassador_applications where tracking_token=token;
 assert app.university='Influencer' and app.status='approved','Influencer source and immediate activation are saved';
 assert app.requested_code ~ '^INF-[A-F0-9]{4}$','Short code generated automatically';
 assert exists(select 1 from public.ambassador_codes where ambassador_id=app.ambassador_id and code=app.requested_code and is_active),'Code activates without approval';
 assert public.register_influencer(e,'Test Influencer',v_email,'01000000000',true,token)=token,'Retry is idempotent';
 assert (select count(*) from public.campus_ambassador_applications where event_id=e and lower(campus_ambassador_applications.email)=v_email)=1,'No duplicate registration';
 perform public.register_influencer(e,'Second Influencer','second-'||v_email,'01000000001',true,token2);
 select * into second from public.campus_ambassador_applications where tracking_token=token2;
 assert app.requested_code<>second.requested_code,'Different influencers get different codes';
 rejected:=false;begin perform public.register_influencer(e,'Another Name',v_email,'01000000002',true,gen_random_uuid());exception when others then rejected:=true;end;
 assert rejected,'Email-only retry does not expose another private link';
 rejected:=false;begin perform public.register_influencer(e,'Another Name','other-'||v_email,'01000000002',true,token);exception when others then rejected:=true;end;
 assert rejected,'A private token cannot be reassigned';
 q:=public.reserve_event_quote(e,session,5,app.requested_code);
 assert (q->>'discountPercent')::numeric=10 and q->>'code'=app.requested_code,'Generated code works immediately in checkout';
 assert (q->>'total')::numeric=round((q->>'originalSubtotal')::numeric*0.9,2)+(q->>'fees')::numeric,'Totals still use server discount rules';
 assert not has_function_privilege('anon','public.register_influencer(uuid,text,text,text,boolean,uuid)','execute'),'Public registration passes through validating server';
 assert not has_function_privilege('authenticated','public.register_influencer(uuid,text,text,text,boolean,uuid)','execute'),'Ordinary sessions cannot call privileged registration';
end $$;
rollback;
