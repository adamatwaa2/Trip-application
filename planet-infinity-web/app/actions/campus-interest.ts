"use server";
import {createServiceClient,isSupabaseServiceConfigured} from "@/lib/supabase/service";
export async function submitCampusInterest(form:FormData):Promise<{ok:boolean;error?:string}>{
 const field=(name:string)=>String(form.get(name)??"").trim();
 if(field('website'))return {ok:true};
 const name=field('name'),university=field('university'),email=field('email').toLowerCase(),phone=field('phone');
 if(name.length<2||name.length>120||university.length<2||university.length>120||phone.length<6||phone.length>40||email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||form.get('consent')!=='on')return {ok:false,error:"Check your name, university, email, phone and privacy consent."};
 if(!isSupabaseServiceConfigured())return {ok:false,error:"Applications are unavailable in this environment."};
 const db=createServiceClient();
 const {data:event}=await db.from('events').select('id').eq('slug','halloween-party-2026').eq('is_published',true).maybeSingle();
 if(!event)return {ok:false,error:"Campus Ambassador applications are not open yet."};
 const {error}=await db.rpc('submit_campus_interest',{p_event_id:event.id,p_name:name,p_university:university,p_email:email,p_phone:phone,p_consent:true});
 return error?{ok:false,error:"We could not receive your application. Please try again."}:{ok:true};
}
