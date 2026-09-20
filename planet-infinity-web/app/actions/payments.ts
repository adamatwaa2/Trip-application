"use server";

import { randomUUID } from "node:crypto";
import { getPaymobConfig, isPaymobConfigured } from "@/lib/paymob/config";
import { createPaymobIntention, PaymobIntentionError } from "@/lib/paymob/intention";
import {
  createServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

type PaymentBooking = {
  id: string;
  booking_number: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  currency: string;
  customer: { full_name: string; email: string; phone: string | null } | null;
  trip: { title: string } | null;
  event: { title: string } | null;
};

function nameParts(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Guest",
    lastName: parts.slice(1).join(" ") || "Guest",
  };
}

export async function createPaymobCheckout(paymentToken: string): Promise<CheckoutResult> {
  if (!UUID.test(paymentToken)) return { ok: false, error: "This payment link is invalid." };
  if (!isPaymobConfigured() || !isSupabaseServiceConfigured()) {
    return { ok: false, error: "Online card payments are being configured." };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, booking_number, status, total_amount, amount_paid, currency, customer:customers(full_name, email, phone), trip:trips(title), event:events(title)")
    .eq("payment_token", paymentToken)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "This payment link is invalid." };

  const booking = data as unknown as PaymentBooking;
  if (booking.status === "cancelled") return { ok: false, error: "This booking has been cancelled." };
  const balance = Number(booking.total_amount) - Number(booking.amount_paid);
  if (!Number.isFinite(balance) || balance <= 0) return { ok: false, error: "This booking is already paid." };
  if (!booking.customer?.phone) return { ok: false, error: "Add a mobile number to the booking before paying online." };

  const { data: existing } = await supabase
    .from("payments")
    .select("checkout_url, created_at")
    .eq("booking_id", booking.id)
    .eq("provider", "paymob")
    .in("gateway_status", ["created", "pending"])
    .not("checkout_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const existingAge = existing?.created_at
    ? Date.now() - new Date(existing.created_at).getTime()
    : Number.POSITIVE_INFINITY;
  if (existing?.checkout_url && existingAge >= 0 && existingAge < 10 * 60 * 1000) {
    return { ok: true, checkoutUrl: existing.checkout_url };
  }

  const config = getPaymobConfig();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const amountPiasters = Math.round(balance * 100);
  const productTitle = booking.trip?.title ?? booking.event?.title ?? "Planet Infinity booking";
  const { firstName, lastName } = nameParts(booking.customer.full_name);

  const providerReference = `${booking.booking_number}-${randomUUID()}`;
  const paymentMethods = [config.cardIntegrationId];
  if (config.walletIntegrationId) paymentMethods.push(config.walletIntegrationId);

  let intention;
  try {
    intention = await createPaymobIntention(config, {
      amount: amountPiasters,
      currency: "EGP",
      paymentMethods,
      item: {
        name: productTitle.slice(0, 120),
        description: `Booking ${booking.booking_number}`,
      },
      billingData: {
        firstName,
        lastName,
        email: booking.customer.email,
        phoneNumber: booking.customer.phone,
      },
      specialReference: providerReference,
      notificationUrl: `${siteUrl}/api/payments/paymob/webhook`,
      redirectionUrl: `${siteUrl}/payment/result`,
    });
  } catch (error) {
    console.error("Paymob intention creation failed", {
      status: error instanceof PaymobIntentionError ? error.status : null,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return { ok: false, error: "Paymob could not start this payment. Please try again." };
  }

  const checkoutUrl = `${config.baseUrl}/unifiedcheckout/?publicKey=${encodeURIComponent(config.publicKey)}&clientSecret=${encodeURIComponent(intention.clientSecret)}`;
  const idempotencyKey = randomUUID();
  const { error: insertError } = await supabase.from("payments").insert({
    booking_id: booking.id,
    amount: balance,
    currency: "EGP",
    payment_method: "paymob_card",
    status: "pending",
    provider: "paymob",
    gateway_status: "created",
    provider_intention_id: intention.id,
    provider_order_id: intention.orderId,
    provider_reference: providerReference,
    idempotency_key: idempotencyKey,
    checkout_url: checkoutUrl,
    provider_data: {
      intention_id: intention.id,
      enabled_integration_ids: paymentMethods,
    },
  });
  if (insertError) return { ok: false, error: "The payment attempt could not be saved." };

  return { ok: true, checkoutUrl };
}
