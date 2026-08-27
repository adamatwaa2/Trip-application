import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { BookingConfirmationAdminActions } from "@/components/BookingConfirmationAdminActions";
import { requireAdmin } from "@/lib/admin";
import { getBooking } from "@/lib/admin-operations";
import { formatDate, getPaymentProofUrl } from "@/lib/admin-requests";

export const metadata = { title: "Booking details" };

type CustomResponse = { label?: unknown; answer?: unknown };

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function customResponses(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const response = item as CustomResponse;
    if (typeof response.label !== "string") return [];
    const answer = Array.isArray(response.answer)
      ? response.answer.join(", ")
      : String(response.answer ?? "");
    return answer.trim() ? [{ label: response.label, answer }] : [];
  });
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireAdmin();
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  const balance = Number(booking.total_amount) - Number(booking.amount_paid);
  const subject = booking.trip?.title ?? booking.event?.title ?? booking.booking_type;
  const proofUrls = await Promise.all(
    booking.payments.map((payment) => getPaymentProofUrl(payment.payment_proof_path)),
  );
  const answers = customResponses(booking.selections?.customResponses);
  const selectedOptions = stringList(booking.selections?.selections);
  const seats = Array.isArray(booking.selections?.seats)
    ? booking.selections.seats.map(String)
    : [];
  const additionalGuests = (booking.guests ?? []).filter((guest) => !guest.is_primary);
  const hasTripAnswers =
    additionalGuests.length > 0 ||
    seats.length > 0 ||
    selectedOptions.length > 0 ||
    answers.length > 0 ||
    Boolean(booking.notes);

  return (
    <AdminShell profile={profile} current="/admin/bookings">
      <header className="pi-admin-page-head pi-admin-detail-head">
        <div>
          <p className="pi-admin-kicker">{booking.booking_number}</p>
          <h1>{subject}</h1>
          <p>{booking.customer?.full_name ?? "Unknown customer"} · {booking.status}</p>
        </div>
        <Link href="/admin/bookings">Back to bookings</Link>
      </header>

      <div className="pi-admin-detail-grid">
        <section className="pi-admin-section">
          <h2>Customer & booking</h2>
          <dl className="pi-admin-details">
            <div><dt>Customer</dt><dd>{booking.customer ? <Link href={`/admin/customers/${booking.customer.id}`}>{booking.customer.full_name}</Link> : "Unknown"}</dd></div>
            <div><dt>Email</dt><dd>{booking.customer?.email ?? "Not provided"}</dd></div>
            <div><dt>Mobile</dt><dd>{booking.customer?.phone ?? "Not provided"}</dd></div>
            <div><dt>WhatsApp confirmation</dt><dd>{booking.whatsapp_opt_in ? "Customer opted in" : "Not requested"}</dd></div>
            <div><dt>Guests</dt><dd>{booking.guest_count}</dd></div>
            <div><dt>Scheduled</dt><dd>{formatDate(booking.scheduled_at)}</dd></div>
            <div><dt>Source</dt><dd>{booking.request ? <Link href={`/admin/requests/${booking.request.id}`}>{booking.request.request_number}</Link> : "Direct booking"}</dd></div>
            <div><dt>Total</dt><dd>{booking.total_amount} EGP</dd></div>
            <div><dt>Paid</dt><dd>{booking.amount_paid} EGP</dd></div>
            <div><dt>Balance</dt><dd>{balance} EGP</dd></div>
          </dl>
          <p><Link href={`/pay/${booking.payment_token}`}>Open customer payment page</Link></p>
        </section>

        <section className="pi-admin-section">
          <h2>Trip answers</h2>
          {additionalGuests.length > 0 ? (
            <>
              <h3>Additional guests</h3>
              <ul>{additionalGuests.map((guest, index) => <li key={`${guest.full_name}-${index}`}>{guest.full_name}</li>)}</ul>
            </>
          ) : null}
          {seats.length > 0 ? <p><strong>Seats:</strong> {seats.join(", ")}</p> : null}
          {selectedOptions.length > 0 ? (
            <>
              <h3>Selected options</h3>
              <ul>{selectedOptions.map((option) => <li key={option}>{option}</li>)}</ul>
            </>
          ) : null}
          {answers.length > 0 ? (
            <dl className="pi-admin-details">
              {answers.map((answer) => <div key={answer.label}><dt>{answer.label}</dt><dd>{answer.answer}</dd></div>)}
            </dl>
          ) : null}
          {booking.notes ? <p><strong>Notes:</strong> {booking.notes}</p> : null}
          {!hasTripAnswers ? <div className="pi-admin-empty">No additional answers were submitted.</div> : null}
        </section>

        <section className="pi-admin-section">
          <h2>Payments & receipt</h2>
          {booking.payments.length ? (
            <ol className="pi-admin-history">
              {booking.payments.map((payment, index) => (
                <li key={payment.id}>
                  <strong>{payment.amount} EGP · {payment.status}</strong>
                  <span>{formatDate(payment.received_at ?? payment.created_at)}</span>
                  <p>{payment.payment_method}{payment.reference ? ` · ${payment.reference}` : ""}</p>
                  {proofUrls[index] ? <p><a href={proofUrls[index] ?? undefined} target="_blank" rel="noreferrer">Open uploaded receipt</a></p> : null}
                </li>
              ))}
            </ol>
          ) : <div className="pi-admin-empty">No payment receipt recorded.</div>}
          <p><Link href="/admin/payments">Verify or record a payment</Link></p>
        </section>

        <section className="pi-admin-section">
          <h2>Booking Confirmation</h2>
          <p>
            {booking.whatsapp_opt_in
              ? "When Meta is connected, the issued PDF can be sent automatically to this customer's WhatsApp."
              : "This customer did not opt in to WhatsApp delivery. The PDF can still be downloaded and sent manually."}
          </p>
          <BookingConfirmationAdminActions
            bookingId={booking.id}
            servicesConfirmed={Boolean(booking.services_confirmed_at)}
            fullyPaid={Number(booking.amount_paid) >= Number(booking.total_amount)}
            confirmationReady={Boolean(booking.confirmation_ready_at)}
            confirmationIssued={Boolean(booking.confirmation_issued_at)}
          />
        </section>
      </div>
    </AdminShell>
  );
}
