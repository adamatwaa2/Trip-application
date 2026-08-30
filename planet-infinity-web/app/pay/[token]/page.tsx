import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymobCheckoutButton } from "@/components/PaymobCheckoutButton";
import { PaidSeatSelection } from "@/components/PaidSeatSelection";
import { DEFAULT_SEAT_VEHICLE_ID, seatConfigVehicles } from "@/content/trips";
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
  confirmation_issued_at: string | null;
  confirmation_pdf_path: string | null;
  currency: string;
  event: { title: string } | null;
  customer: { full_name: string } | null;
  guest_count: number;
  scheduled_at: string | null;
  selections: { seats?: number[]; seatVehicleId?: string };
  trip: { title: string; seat_selection_enabled?: boolean; seat_config?: import("@/content/trips").SeatConfig | null } | null;
  payments: { status: string; payment_proof_path: string | null }[] | null;
};

export default async function PaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isSupabaseServiceConfigured()) notFound();

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, trip_id, booking_number, status, total_amount, amount_paid, confirmation_issued_at, confirmation_pdf_path, currency, guest_count, scheduled_at, selections, customer:customers(full_name), trip:trips(title, seat_selection_enabled, seat_config), event:events(title), payments(status, payment_proof_path)")
    .eq("payment_token", token)
    .maybeSingle();
  if (!data) notFound();

  const booking = data as unknown as PublicPaymentBooking;
  const balance = Math.max(0, Number(booking.total_amount) - Number(booking.amount_paid));
  const proofAwaitingVerification = (booking.payments ?? []).some(
    (payment) => payment.status === "pending" && Boolean(payment.payment_proof_path),
  );
  const subject = booking.trip?.title ?? booking.event?.title ?? "Planet Infinity booking";
  const confirmationIssued = Boolean(booking.confirmation_issued_at && booking.confirmation_pdf_path);
  const selectedSeats = Array.isArray(booking.selections?.seats) ? booking.selections.seats.map(Number).filter(Number.isInteger) : [];
  const selectedVehicleId = typeof booking.selections?.seatVehicleId === "string" ? booking.selections.seatVehicleId : DEFAULT_SEAT_VEHICLE_ID;
  let seatConfig = booking.trip?.seat_config ?? null;
  if (seatConfig && booking.trip?.seat_selection_enabled) {
    const { data: reservations } = await supabase.from("trip_seat_reservations").select("seat_number, vehicle_id, booking_id").eq("trip_id", booking.trip_id!).eq("scheduled_at", booking.scheduled_at).in("status", ["reserved", "held"]);
    const vehicles = seatConfigVehicles(seatConfig).map((vehicle) => ({
      ...vehicle,
      taken: (reservations ?? [])
        .filter((row: { vehicle_id: string; booking_id: string | null }) => row.vehicle_id === vehicle.id && row.booking_id !== booking.id)
        .map((row: { seat_number: number }) => row.seat_number),
    }));
    seatConfig = { ...seatConfig, vehicles };
  }
  const instapayAddress = process.env.NEXT_PUBLIC_INSTAPAY_ADDRESS?.trim() ?? "";
  const instapayAccountName = process.env.NEXT_PUBLIC_INSTAPAY_ACCOUNT_NAME?.trim() || "Planet Infinity";
  const vodafoneCashNumber = process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER?.trim() ?? "";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>Planet Infinity · Secure checkout</p>
        <h1>{confirmationIssued ? "Booking confirmed." : proofAwaitingVerification ? "Payment received." : balance <= 0 ? "Payment verified." : "Pay your booking."}</h1>
        <p className={styles.intro}>{confirmationIssued ? "Everything is complete. Your final Booking Confirmation PDF is ready below." : proofAwaitingVerification ? "We received your payment receipt. Your booking is waiting for verification — you do not need to submit or pay again." : balance <= 0 ? "Your payment has been recorded. We are completing the final service confirmation." : "Review the remaining amount below. Use the available payment method and keep your booking number as the transfer reference."}</p>
        <dl className={styles.details}>
          <div><dt>Booking</dt><dd>{booking.booking_number}</dd></div>
          <div><dt>Customer</dt><dd>{booking.customer?.full_name ?? "Guest"}</dd></div>
          <div><dt>Trip / event</dt><dd>{subject}</dd></div>
          <div><dt>Total</dt><dd>{Number(booking.total_amount).toLocaleString("en-US")} {booking.currency}</dd></div>
          <div><dt>Paid</dt><dd>{Number(booking.amount_paid).toLocaleString("en-US")} {booking.currency}</dd></div>
          <div><dt>Remaining</dt><dd>{balance.toLocaleString("en-US")} {booking.currency}</dd></div>
        </dl>
        {booking.status === "cancelled" ? (
          <p className={styles.unavailable}>This booking has been cancelled.</p>
        ) : confirmationIssued ? (
          <>
            <section className={styles.confirmed} aria-label="Booking confirmation ready">
              <p><strong>✓ Payment verified</strong></p>
              <p><strong>✓ Services confirmed</strong></p>
              <p><strong>✓ Booking Confirmation issued</strong></p>
              <a className={styles.downloadButton} href={`/pay/${token}/confirmation`} download={`${booking.booking_number}-confirmation.pdf`}>Download Booking Confirmation PDF</a>
            </section>
            {seatConfig && booking.trip?.seat_selection_enabled ? <PaidSeatSelection paymentToken={token} guestCount={booking.guest_count} config={seatConfig} currentSeats={selectedSeats} currentVehicleId={selectedVehicleId} /> : null}
          </>
        ) : proofAwaitingVerification ? (
          <p className={styles.awaiting}><strong>Receipt awaiting verification</strong><span>Our team will confirm the payment after checking the receiving account. We will then update your booking.</span></p>
        ) : balance <= 0 ? (
          <p className={styles.awaiting}><strong>Payment verified</strong><span>We are confirming the final trip services. Your Booking Confirmation PDF and seat selection will appear here as soon as the booking is issued.</span></p>
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
                  <div><dt>Remaining to pay</dt><dd>{balance.toLocaleString("en-US")} {booking.currency}</dd></div>
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
