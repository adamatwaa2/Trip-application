import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { RequestStatusForm } from "@/components/RequestStatusForm";
import { RequestToBookingForm } from "@/components/RequestToBookingForm";
import { formatDate, getPaymentProofUrl, getRequest, getRequestHistory, requestSubject, requestTypeLabel } from "@/lib/admin-requests";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Request details" };

function customResponses(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const source = entry as { label?: unknown; answer?: unknown };
    if (typeof source.label !== "string") return [];
    const answer = Array.isArray(source.answer)
      ? source.answer.filter((item): item is string => typeof item === "string").join(", ")
      : source.answer === true
        ? "Yes"
        : source.answer === false
          ? "No"
          : typeof source.answer === "string"
            ? source.answer
            : "—";
    return [{ label: source.label, answer }];
  });
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireAdmin();
  const { id } = await params;
  const [request, history] = await Promise.all([getRequest(id), getRequestHistory(id)]);
  if (!request) notFound();
  const paymentProofUrl = await getPaymentProofUrl(request.payment_proof_path);
  const tripAnswers = customResponses(request.selections.customResponses);

  return (
    <AdminShell profile={profile} current="/admin/requests">
      <header className="pi-admin-page-head pi-admin-detail-head">
        <div><p className="pi-admin-kicker">{request.request_number}</p><h1>{request.customer?.full_name ?? "Customer"}</h1><p>{requestTypeLabel(request.request_type)} · received {formatDate(request.created_at)}</p></div>
        <Link href="/admin/requests">Back to requests</Link>
      </header>
      <div className="pi-admin-detail-grid">
        <section className="pi-admin-section">
          <div className="pi-admin-section__head"><h2>Request</h2><span className={`pi-admin-status pi-admin-status--${request.status}`}>{request.status}</span></div>
          <dl className="pi-admin-details">
            <div><dt>Guest</dt><dd>{request.customer?.full_name ?? "Unknown"}</dd></div>
            <div><dt>Email</dt><dd>{request.customer?.email ? <a href={`mailto:${request.customer.email}`}>{request.customer.email}</a> : "Not provided"}</dd></div>
            <div><dt>Phone</dt><dd>{request.customer?.phone || "Not provided"}</dd></div>
            <div><dt>Subject</dt><dd>{requestSubject(request)}</dd></div>
            <div><dt>Guests</dt><dd>{request.guest_count ?? "Not provided"}</dd></div>
            <div><dt>Booking</dt><dd>{request.booking ? <Link href={`/admin/bookings/${request.booking.id}`}>{request.booking.booking_number}</Link> : "Not created"}</dd></div>
            <div><dt>Payment method</dt><dd>{request.payment_method === "vodafone_cash" ? "Vodafone Cash" : request.payment_method === "instapay" ? "InstaPay" : "Not submitted"}</dd></div>
          </dl>
          {paymentProofUrl ? <div className="pi-admin-payment-proof"><h3>Uploaded payment receipt</h3><a href={paymentProofUrl} target="_blank" rel="noreferrer"><Image src={paymentProofUrl} width={900} height={900} unoptimized alt={`Payment receipt for ${request.request_number}`} /></a><p>Review the receiving account before recording this payment. The uploaded image alone is not proof of a successful transfer.</p></div> : null}
          {tripAnswers.length ? <div className="pi-admin-submitted-answers"><h3>Trip-specific answers</h3><dl className="pi-admin-details">{tripAnswers.map((answer, index) => <div key={`${answer.label}-${index}`}><dt>{answer.label}</dt><dd>{answer.answer}</dd></div>)}</dl></div> : null}
          <h3>Submitted details</h3>
          <pre className="pi-admin-payload">{JSON.stringify({ selections: request.selections, notes: request.notes }, null, 2)}</pre>
        </section>
        <aside className="pi-admin-section"><h2>Update request</h2><RequestStatusForm requestId={request.id} currentStatus={request.status} currentNote={request.admin_note} /><h3>Convert to booking</h3>{request.booking ? <p className="pi-admin-success">This request is linked to {request.booking.booking_number}.</p> : <RequestToBookingForm requestId={request.id} disabled={request.request_type === "application" || request.status !== "accepted"} />}</aside>
      </div>
      <section className="pi-admin-section"><div className="pi-admin-section__head"><div><p className="pi-admin-kicker">History</p><h2>Status changes</h2></div></div>
        {history.length ? <ol className="pi-admin-history">{history.map((item) => <li key={item.id}><strong>{item.from_status ? `${item.from_status} → ${item.to_status}` : item.to_status}</strong><span>{formatDate(item.created_at)}</span>{item.note ? <p>{item.note}</p> : null}</li>)}</ol> : <div className="pi-admin-empty">No status changes yet.</div>}
      </section>
    </AdminShell>
  );
}
