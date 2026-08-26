import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymobCheckoutButton } from "@/components/PaymobCheckoutButton";
import { isPaymobConfigured } from "@/lib/paymob/config";
import {
  createServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Secure payment" };

type PublicPaymentBooking = {
  booking_number: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  currency: string;
  trip: { title: string } | null;
  event: { title: string } | null;
};

export default async function PaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isSupabaseServiceConfigured()) notFound();

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("bookings")
    .select("booking_number, status, total_amount, amount_paid, currency, trip:trips(title), event:events(title)")
    .eq("payment_token", token)
    .maybeSingle();
  if (!data) notFound();

  const booking = data as unknown as PublicPaymentBooking;
  const balance = Math.max(0, Number(booking.total_amount) - Number(booking.amount_paid));
  const subject = booking.trip?.title ?? booking.event?.title ?? "Planet Infinity booking";
  const instapayAddress = process.env.NEXT_PUBLIC_INSTAPAY_ADDRESS?.trim() ?? "";
  const instapayAccountName = process.env.NEXT_PUBLIC_INSTAPAY_ACCOUNT_NAME?.trim() || "Planet Infinity";
  const vodafoneCashNumber = process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER?.trim() ?? "";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>Planet Infinity · Secure checkout</p>
        <h1>Pay your booking.</h1>
        <p className={styles.intro}>Review the confirmed balance below. Use the available payment method and keep your booking number as the transfer reference.</p>
        <dl className={styles.details}>
          <div><dt>Booking</dt><dd>{booking.booking_number}</dd></div>
          <div><dt>Trip / event</dt><dd>{subject}</dd></div>
          <div><dt>Total</dt><dd>{Number(booking.total_amount).toLocaleString("en-US")} {booking.currency}</dd></div>
          <div><dt>Balance</dt><dd>{balance.toLocaleString("en-US")} {booking.currency}</dd></div>
        </dl>
        {booking.status === "cancelled" ? (
          <p className={styles.unavailable}>This booking has been cancelled.</p>
        ) : balance <= 0 ? (
          <p className={styles.unavailable}>This booking is already paid in full.</p>
        ) : (
          <div className={styles.paymentOptions}>
            {isPaymobConfigured() ? (
              <div className={styles.option}>
                <p className={styles.optionLabel}>Card payment</p>
                <p>Pay securely through Paymob. Planet Infinity does not receive or store your card details.</p>
                <PaymobCheckoutButton paymentToken={token} />
              </div>
            ) : null}
            {instapayAddress ? (
              <div className={styles.option}>
                <p className={styles.optionLabel}>InstaPay / Vodafone Cash transfer</p>
                <dl className={styles.transferDetails}>
                  <div><dt>Address</dt><dd>{instapayAddress}</dd></div>
                  {vodafoneCashNumber ? <div><dt>Vodafone Cash</dt><dd>{vodafoneCashNumber}</dd></div> : null}
                  <div><dt>Account</dt><dd>{instapayAccountName}</dd></div>
                  <div><dt>Exact amount</dt><dd>{balance.toLocaleString("en-US")} {booking.currency}</dd></div>
                  <div><dt>Reference</dt><dd>{booking.booking_number}</dd></div>
                </dl>
                <p className={styles.manualNotice}>Your payment is confirmed after our team checks the receiving account. Never send an OTP, PIN, or card details.</p>
                <p className={styles.manualNotice}>The receipt is uploaded inside the trip booking form and reviewed privately by an admin.</p>
              </div>
            ) : null}
            {!isPaymobConfigured() && !instapayAddress ? (
              <p className={styles.unavailable}>Online payment instructions are being configured. Your booking has not been charged.</p>
            ) : null}
          </div>
        )}
        <p className={styles.note}>By continuing you keep the policy acceptance attached to this booking. Read the <Link href="/policies">published policies</Link>.</p>
      </section>
    </main>
  );
}
