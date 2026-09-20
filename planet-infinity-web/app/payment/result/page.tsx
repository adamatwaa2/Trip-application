import Link from "next/link";
import { BreakOutOfFrame } from "@/components/BreakOutOfFrame";
import { getPaymobConfig } from "@/lib/paymob/config";
import { verifyPaymobRedirectHmac } from "@/lib/paymob/hmac";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment result" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PaymentResult = {
  status: string;
  gateway_status: string | null;
  booking: { payment_token: string; booking_number: string } | null;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function PaymentResultPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }

  let signatureValid = false;
  try {
    const config = getPaymobConfig();
    signatureValid = verifyPaymobRedirectHmac(params, first(raw.hmac), config.hmacSecret);
  } catch {
    signatureValid = false;
  }

  let payment: PaymentResult | null = null;
  if (signatureValid && isSupabaseServiceConfigured()) {
    const supabase = createServiceClient();
    const transactionId = first(raw.id);
    const orderId = first(raw.order);
    const providerReference = first(raw.merchant_order_id);
    const select = "status, gateway_status, booking:bookings(payment_token, booking_number)";

    if (transactionId) {
      const result = await supabase.from("payments").select(select)
        .eq("provider", "paymob").eq("provider_transaction_id", transactionId).maybeSingle();
      payment = result.data as unknown as PaymentResult | null;
    }
    if (!payment && orderId) {
      const result = await supabase.from("payments").select(select)
        .eq("provider", "paymob").eq("provider_order_id", orderId)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      payment = result.data as unknown as PaymentResult | null;
    }
    if (!payment && providerReference) {
      const result = await supabase.from("payments").select(select)
        .eq("provider", "paymob").eq("provider_reference", providerReference).maybeSingle();
      payment = result.data as unknown as PaymentResult | null;
    }
  }

  const succeeded = payment?.gateway_status === "succeeded" && payment.status === "recorded";
  const failed = payment?.gateway_status === "failed" || first(raw.success) === "false";
  const title = !signatureValid
    ? "We could not verify this return."
    : succeeded
      ? "Payment verified."
      : failed
        ? "Payment was not completed."
        : "We’re checking your payment.";
  const message = !signatureValid
    ? "Return to your secure booking link to check the latest status. No payment was confirmed from this page."
    : succeeded
      ? "Paymob confirmed the transaction and your booking balance has been updated."
      : failed
        ? "Your booking has not been charged by this attempt. You can safely return and try again."
        : "The secure callback may arrive a moment after the browser redirect. Your booking page always shows the server-verified status.";
  const paymentPath = payment?.booking?.payment_token
    ? `/pay/${payment.booking.payment_token}`
    : null;

  return (
    <main className={styles.page}>
      <BreakOutOfFrame />
      <section className={styles.card}>
        <p className={styles.kicker}>Planet Infinity · Secure payment</p>
        <h1>{title}</h1>
        <p>{message}</p>
        {payment?.booking?.booking_number ? (
          <p className={styles.reference}>Booking {payment.booking.booking_number}</p>
        ) : null}
        <div className={styles.actions}>
          {paymentPath ? <Link href={paymentPath}>View booking status</Link> : null}
          <Link className={styles.secondary} href="/">Back to Planet Infinity</Link>
        </div>
      </section>
    </main>
  );
}
