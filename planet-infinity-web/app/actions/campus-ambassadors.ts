"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export async function saveAmbassador(form:FormData){
 await requireAdmin();
 const text=(key:string)=>String(form.get(key)??"").trim();
 const supabase=await createClient();
 const {error}=await supabase.rpc("save_campus_ambassador",{p_id:text("id")||null,p_event_id:text("eventId"),p_name:text("name"),p_university:text("university"),p_email:text("email"),p_phone:text("phone"),p_code:form.get("regenerate")==="on"?null:text("code").toUpperCase()||null,p_active:form.get("active")==="on",p_prefix:text("prefix").toUpperCase()});
 if(error)return {ok:false,error:error.code==="23505"?"This code is already assigned.":"Could not save. Check the name, code and event."};
 revalidatePath("/admin/ambassadors");return {ok:true};
}
export async function saveSalesRules(eventId:string,prices:unknown,discounts:unknown,commissions:unknown){
 await requireAdmin();
 const supabase=await createClient();
 const {error}=await supabase.rpc("save_event_sales_rules",{p_event_id:eventId,p_prices:prices,p_discounts:discounts,p_commissions:commissions});
 if(error)return {ok:false,error:"Invalid rules. Tiers must start at 1, increase in order, and use valid prices or percentages."};
 revalidatePath("/admin/ambassadors");revalidatePath("/events");revalidatePath("/events/halloween-party-2026");return {ok:true};
}
export async function issueAmbassadorEntry(id:string){
 await requireAdmin();
 const supabase=await createClient();
 const {data,error}=await supabase.rpc("issue_ambassador_entry",{p_ambassador_id:id});
 if(error)return {ok:false,error:/capacity|valid email|active ambassador/i.test(error.message)?error.message:"Could not issue the entry ticket."};
 revalidatePath("/admin/ambassadors");return {ok:true,token:String(data)};
}
