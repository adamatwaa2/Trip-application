"use server";
import {createServiceClient,isSupabaseServiceConfigured} from "@/lib/supabase/service";

export async function submitInfluencerInterest(form:FormData):Promise<{ok:boolean;error?:string;statusPath?:string}>{
 const field=(name:string)=>String(form.get(name)??'').trim();
 if(field('website'))return {ok:true};
 const name=field('name'),email=field('email').toLowerCase(),phone=field('phone'),trackingToken=field('trackingToken');
 if(name.length<2||name.length>120||phone.length<6||phone.length>40||email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||form.get('consent')!=='on')return {ok:false,error:'Check your name, email, phone and privacy consent.'};
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trackingToken))return {ok:false,error:'Please refresh the form and try again.'};
 if(!isSupabaseServiceConfigured())return {ok:false,error:'Registration is unavailable in this environment.'};
 const db=createServiceClient();
 const {data:event}=await db.from('events').select('id').eq('slug','halloween-party-2026').eq('is_published',true).maybeSingle();
 if(!event)return {ok:false,error:'Influencer registration is not open yet.'};
 const {data,error}=await db.rpc('register_influencer',{p_event_id:event.id,p_name:name,p_email:email,p_phone:phone,p_consent:true,p_tracking_token:trackingToken});
 if(error)return {ok:false,error:/^Registration already exists/.test(error.message)?error.message:'We could not complete registration. Check your details and try again.'};
 return {ok:true,statusPath:`/ambassadors/status/${data}`};
}
