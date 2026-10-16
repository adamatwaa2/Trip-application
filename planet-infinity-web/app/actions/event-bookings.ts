"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { sendAdminPush } from "@/lib/admin-push";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { HALLOWEEN_EVENT, HALLOWEEN_TERMS } from "@/content/events/halloween";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Input = { eventId: string; submissionId: string; email: string; guests: { name: string; phone: string }[]; termsAccepted: boolean; paymentMethod: "manual" | "paymob"; paymentProof: { method: string; path: string } | null };

export async function submitPublicEventBooking(input: Input): Promise<{ok:true;bookingNumber:string;paymentToken?:string}|{ok:false;error:string}> {
  if (!input || !UUID.test(input.eventId) || !UUID.test(input.submissionId) || input.termsAccepted !== true || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email) || input.email.length>254) return {ok:false,error:"Check your booking details and accept the event policies."};
  if (!["manual","paymob"].includes(input.paymentMethod) || !Array.isArray(input.guests) || input.guests.length<1) return {ok:false,error:"Choose a valid guest count and payment method."};
  if (input.guests.some(g=>!g || typeof g.name!=="string" || g.name.trim().length<2 || g.name.length>120 || typeof g.phone!=="string" || g.phone.trim().length<6 || g.phone.length>40)) return {ok:false,error:"Check every guest's name and phone number."};
  if (!isSupabaseConfigured() || !isSupabaseServiceConfigured()) return {ok:false,error:"Event bookings are not open in this environment."};
  // The privileged RPC is service-role-only and performs all writes atomically.
  // It validates the published product, price, capacity, receipt and policy version.
  const {data,error} = await createServiceClient().rpc("submit_public_event_booking",{
    p_event_id:input.eventId,p_submission_id:input.submissionId,p_email:input.email.trim().toLowerCase(),p_guests:input.guests.map(g=>({name:g.name.trim(),phone:g.phone.trim()})),p_payment_method:input.paymentMethod,p_payment_proof:input.paymentProof,p_terms_accepted:input.termsAccepted,
  });
  const row=data?.[0];
  if (error || !row?.booking_number) {
    const message = error?.message ?? "";
    return {ok:false,error:/price|unavailable|capacity|receipt|group|polic|already|age/i.test(message) && !/function|schema|column|relation/i.test(message) ? message.slice(0,180) : "Event checkout is temporarily unavailable. Please contact Planet Infinity."};
  }
  after(async()=>{await sendAdminPush({title:"New event booking",body:`${row.booking_number} is ready for review.`,url:"/admin/bookings"});});
  return {ok:true,bookingNumber:row.booking_number,paymentToken:typeof row.payment_token === "string" ? row.payment_token : undefined};
}

export async function createHalloweenDraft(): Promise<{ok:true;id:string}|{ok:false;error:string}> {
  await requireAdmin();
  const supabase=await createClient();
  const {data:existing,error:lookupError}=await supabase.from("events").select("id").eq("slug",HALLOWEEN_EVENT.slug).maybeSingle();
  if(lookupError) return {ok:false,error:"The event catalogue could not be loaded."};
  if(existing) return {ok:true,id:existing.id};
  const {data,error}=await supabase.from("events").insert({id:HALLOWEEN_EVENT.id,slug:HALLOWEEN_EVENT.slug,title:HALLOWEEN_EVENT.title,short_description:HALLOWEEN_EVENT.shortDescription,description:HALLOWEEN_EVENT.description.join("\n"),category:HALLOWEEN_EVENT.category,venue:HALLOWEEN_EVENT.venue,starts_at:"2026-10-30T19:00:00+02:00",ends_at:"2026-10-31T02:00:00+02:00",price_egp:HALLOWEEN_EVENT.priceEgp,booking_fee_egp:HALLOWEEN_EVENT.bookingFeeEgp,ticket_label:HALLOWEEN_EVENT.ticketLabel,capacity:null,booking_mode:"booking",application_required:false,is_published:false,is_featured:true,media:HALLOWEEN_EVENT.media,inclusions:HALLOWEEN_EVENT.whatIsIncluded,exclusions:[],important_information:[...HALLOWEEN_TERMS],ticket_options:[]}).select("id").single();
  if(error || !data) return {ok:false,error:"The Halloween draft could not be created."};
  revalidatePath("/admin/events");
  return {ok:true,id:data.id};
}
