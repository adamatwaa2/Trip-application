"use server";
import { after } from "next/server";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { sendAdminPush } from "@/lib/admin-push";
export type SpookyPromoQuote = { quantity: number; code: string | null; unitPrice: number; originalSubtotal: number; discountPercent: number; discountEgp: number; feePerTicket: number; fees: number; total: number };
type Input = { submissionId: string; email: string; guests: { name: string; phone: string }[]; groupType: string; rulesAccepted: boolean; termsAccepted: boolean; promoCode?: string };
function validPromo(code: unknown): code is string { return typeof code === "string" && (code.trim() === "" || /^[A-Z0-9-]{3,24}$/i.test(code.trim())); }
export async function quoteSpookyPromo(quantity: number, code: string): Promise<{ ok: true; quote: SpookyPromoQuote } | { ok: false; error: string }> {
 if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100 || !validPromo(code) || !code.trim()) return { ok: false, error: "Choose your tickets and enter a valid promo code." };
 if (!isSupabaseServiceConfigured()) return { ok: false, error: "Checkout is temporarily unavailable. Please try again." };
 const { data, error } = await createServiceClient().rpc("price_spooky_haus", { p_quantity: quantity, p_code: code.trim().toUpperCase() });
 if (error || !data) return { ok: false, error: error?.message?.includes("invalid or inactive") ? "This promo code is invalid or inactive." : "We could not check this code. Please try again." };
 return { ok: true, quote: data as SpookyPromoQuote };
}
export async function bookSpookyHaus(input: Input): Promise<{ ok: true; bookingNumber: string; paymentToken: string; totalEgp: number } | { ok: false; error: string }> {
 if (!input || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.submissionId) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email) || input.email.length > 254 || input.termsAccepted !== true || input.rulesAccepted !== true) return { ok: false, error: "Check your email and accept the policies and admission rules." };
 if (!["couple","mixed-group","girls-only"].includes(input.groupType) || !Array.isArray(input.guests) || input.guests.length < 1 || input.guests.length > 100 || input.guests.some(g => !g || typeof g.name !== "string" || g.name.trim().length < 2 || g.name.length > 120 || typeof g.phone !== "string" || g.phone.trim().length < 6 || g.phone.length > 40)) return { ok: false, error: "Check your group and every guest’s name and mobile number." };
 if (!isSupabaseServiceConfigured()) return { ok: false, error: "Checkout is temporarily unavailable. Please try again." };
 if (input.promoCode !== undefined && !validPromo(input.promoCode)) return { ok: false, error: "Check your promo code." };
 const { data, error } = await createServiceClient().rpc("book_spooky_haus_with_promo", { p_submission_id: input.submissionId, p_email: input.email.trim().toLowerCase(), p_guests: input.guests.map(g => ({ name:g.name.trim(), phone:g.phone.trim() })), p_group_type: input.groupType, p_rules_accepted: input.rulesAccepted, p_terms_accepted: input.termsAccepted, p_code: input.promoCode?.trim().toUpperCase() || null });
 const row = data?.[0];
 if (error || !row?.payment_token) return { ok:false, error: error?.message && /quantity|group|polic|already|guest|capacity|unavailable|promo/i.test(error.message) && !/function|column|schema/i.test(error.message) ? error.message.slice(0,220) : "We could not start your booking. Please try again." };
 after(async () => { await sendAdminPush({ title:"New Spooky Haus booking", body:row.booking_number+" is awaiting payment.", url:"/admin/bookings" }); });
 return { ok:true, bookingNumber:row.booking_number, paymentToken:row.payment_token, totalEgp:Number(row.total_egp) };
}
