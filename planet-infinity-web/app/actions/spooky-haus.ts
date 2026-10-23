"use server";
import { after } from "next/server";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { sendAdminPush } from "@/lib/admin-push";
type Input = { submissionId: string; email: string; guests: { name: string; phone: string }[]; groupType: string; rulesAccepted: boolean; termsAccepted: boolean };
export async function bookSpookyHaus(input: Input): Promise<{ ok: true; bookingNumber: string; paymentToken: string; totalEgp: number } | { ok: false; error: string }> {
 if (!input || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.submissionId) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email) || input.email.length > 254 || input.termsAccepted !== true || input.rulesAccepted !== true) return { ok: false, error: "Check your email and accept the policies and admission rules." };
 if (!["couple","mixed-group","girls-only"].includes(input.groupType) || !Array.isArray(input.guests) || input.guests.length < 1 || input.guests.length > 100 || input.guests.some(g => !g || typeof g.name !== "string" || g.name.trim().length < 2 || g.name.length > 120 || typeof g.phone !== "string" || g.phone.trim().length < 6 || g.phone.length > 40)) return { ok: false, error: "Check your group and every guest’s name and mobile number." };
 if (!isSupabaseServiceConfigured()) return { ok: false, error: "Checkout is temporarily unavailable. Please try again." };
 const { data, error } = await createServiceClient().rpc("book_spooky_haus", { p_submission_id: input.submissionId, p_email: input.email.trim().toLowerCase(), p_guests: input.guests.map(g => ({ name:g.name.trim(), phone:g.phone.trim() })), p_group_type: input.groupType, p_rules_accepted: input.rulesAccepted, p_terms_accepted: input.termsAccepted });
 const row = data?.[0];
 if (error || !row?.payment_token) return { ok:false, error: error?.message && /quantity|group|polic|already|guest|capacity|unavailable/i.test(error.message) && !/function|column|schema/i.test(error.message) ? error.message.slice(0,220) : "We could not start your booking. Please try again." };
 after(async () => { await sendAdminPush({ title:"New Spooky Haus booking", body:row.booking_number+" is awaiting payment.", url:"/admin/bookings" }); });
 return { ok:true, bookingNumber:row.booking_number, paymentToken:row.payment_token, totalEgp:Number(row.total_egp) };
}
