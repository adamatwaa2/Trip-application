import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymobCheckoutButton } from "@/components/PaymobCheckoutButton";
import { PaidSeatSelection } from "@/components/PaidSeatSelection";
import { isPaymobConfigured } from "@/lib/paymob/config";
import {
  createServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Secure payment",
  description: "Review your Planet Infinity booking and secure payment status.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Secure payment — Planet Infinity",
    description: "Review your Planet Infinity booking and secure payment status.",
    images: [{
      url: "/opengraph-image?brand=20260829",
      width: 1200,
      height: 630,
      alt: "Planet Infinity",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Secure payment — Planet Infinity",
    description: "Review your Planet Infinity booking and secure payment status.",
    images: ["/opengraph-image?brand=20260829"],
  },
};

type PublicPaymentBooking = {
  id: string;
  trip_id: string | null;
  booking_number: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  currency: string;
  event: { title: string } | null;
  guest_count: number;
  scheduled_at: string | null;
  selections: { seats?: number[] };
  trip: { title: string; seat_selection_enabled?: boolean; seat_config?: import("@/content/trips").SeatConfig | null } | null;
};

export default async function PaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isSupabaseServiceConfigured()) notFound();

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, trip_id, booking_number, status, total_amount, amount_paid, currency, guest_count, scheduled_at, selections, trip:trips(title, seat_selection_enabled, seat_config), event:events(title)")
    .eq("payment_token", token)
    .maybeSingle();
  if (!data) notFound();

  const booking = data as unknown as PublicPaymentBooking;
  const balance = Math.max(0, Number(booking.total_amount) - Number(booking.amount_paid));
  const subject = booking.trip?.title ?? booking.event?.title ?? "Planet Infinity booking";
  const selectedSeats = Array.isArray(booking.selections?.seats) ? booking.selections.seats.map(Number).filter(Number.isInteger) : [];
  let seatConfig = booking.trip?.seat_config ?? null;
  if (seatConfig && booking.trip?.seat_selection_enabled) {
    const { data: reservations } = await supabase.from("trip_seat_reservations").select("seat_number").eq("trip_id", booking.trip_id!).eq("scheduled_at", booking.scheduled_at).in("status", ["reserved", "held"]);
    seatConfig = { ...seatConfig, taken: (reservations ?? []).map((row: { seat_number: number }) => row.seat_number).filter((seat: number) => !selectedSeats.includes(seat)) };
  }
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
          <>
            <p className={styles.unavailable}>This booking is already paid in full.</p>
            {seatConfig && booking.trip?.seat_selection_enabled ? <PaidSeatSelection paymentToken={token} guestCount={booking.guest_count} config={seatConfig} currentSeats={selectedSeats} /> : null}
          </>
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
