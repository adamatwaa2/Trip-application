import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { RequestStatusForm } from "@/components/RequestStatusForm";
import { ApplicationStatusForm } from "@/components/ApplicationStatusForm";
import { RequestToBookingForm } from "@/components/RequestToBookingForm";
import { formatDate, getPaymentProofUrl, getPrivateRequestPhotoUrls, getRecruitmentUploadUrls, getRequest, getRequestHistory, requestSubject, requestTypeLabel } from "@/lib/admin-requests";
import { requireAdmin } from "@/lib/admin";
import { careerApplicationAnswers, isCareerApplication, requestAnswerContainerKeys } from "@/lib/request-display";
import { getRecruitmentRole } from "@/content/recruitment";

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

function applicationAnswers(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([label, raw]) => {
    const answer = typeof raw === "string" || typeof raw === "number" ? String(raw) : "";
    return label.trim() && answer.trim() ? [{ label, answer }] : [];
  });
}

function selectionDetails(value: Record<string, unknown>) {
  return Object.entries(value).flatMap(([key, raw]) => {
    if (requestAnswerContainerKeys.has(key) || key === "kind" || raw === null || raw === undefined || raw === "") return [];
    const answer = Array.isArray(raw)
      ? raw.map(String).filter(Boolean).join(", ")
      : raw === true
        ? "Yes"
        : raw === false
          ? "No"
          : typeof raw === "string" || typeof raw === "number"
            ? String(raw)
            : "";
    if (!answer) return [];
    const label = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (letter) => letter.toUpperCase());
    return [{ label, answer }];
  });
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireAdmin();
  const { id } = await params;
  const [request, history] = await Promise.all([getRequest(id), getRequestHistory(id)]);
  if (!request) notFound();
  const careerApplication = isCareerApplication(request);
  const privatePhotoData = request.selections.applicationPhotos ?? request.selections.careerPhotos;
  const [paymentProofUrl, privatePhotos, recruitmentUploads] = await Promise.all([
    getPaymentProofUrl(request.payment_proof_path),
    getPrivateRequestPhotoUrls(privatePhotoData),
    getRecruitmentUploadUrls(request.selections.uploads),
  ]);
  const tripAnswers = [
    ...customResponses(request.selections.customResponses),
    ...applicationAnswers(request.selections.applicationAnswers),
  ];
  const careerAnswers = careerApplication ? careerApplicationAnswers(request.selections) : [];
  const submittedDetails = selectionDetails(request.selections);
  const whatsappNumber = request.customer?.phone?.replace(/\D/g, "") ?? "";
  const whatsappMessage = encodeURIComponent(`Hello ${request.customer?.full_name ?? ""}, this is Planet Infinity regarding ${request.request_number}.`);

  return (
    <AdminShell profile={profile} current="/admin/requests">
      <header className="pi-admin-page-head pi-admin-detail-head">
        <div><p className="pi-admin-kicker">{request.request_number}</p><h1>{request.customer?.full_name ?? (careerApplication ? "Candidate" : "Customer")}</h1><p>{careerApplication ? "Career application" : requestTypeLabel(request.request_type)} · received {formatDate(request.created_at)}</p></div>
        <Link href="/admin/requests">Back to requests</Link>
      </header>
      <div className="pi-admin-detail-grid">
        <section className="pi-admin-section">
          <div className="pi-admin-section__head"><h2>{careerApplication ? "Application" : "Request"}</h2><span className={`pi-admin-status pi-admin-status--${careerApplication ? request.application_status ?? "new" : request.status}`}>{careerApplication ? request.application_status ?? "new" : request.status}</span></div>
          <dl className="pi-admin-details">
            <div><dt>{careerApplication ? "Candidate" : "Guest"}</dt><dd>{request.customer ? <Link href={`/admin/customers/${request.customer.id}`}>{request.customer.full_name}</Link> : "Unknown"}</dd></div>
            <div><dt>Email</dt><dd>{request.customer?.email ? <a href={`mailto:${request.customer.email}`}>{request.customer.email}</a> : "Not provided"}</dd></div>
            <div><dt>Phone</dt><dd>{request.customer?.phone || "Not provided"}</dd></div>
            <div><dt>Subject</dt><dd>{requestSubject(request)}</dd></div>
            {request.application_category ? <div><dt>Category</dt><dd>{request.application_category.replaceAll("-", " ")}</dd></div> : null}
            {request.application_world ? <div><dt>World</dt><dd>{request.application_world.replaceAll("-", " ")}</dd></div> : null}
            {request.application_role ? <div><dt>Role</dt><dd>{getRecruitmentRole(request.application_category ?? "", request.application_role)?.title ?? request.application_role.replaceAll("-", " ")}</dd></div> : null}
            {request.application_country ? <div><dt>Location</dt><dd>{[request.application_city, request.application_country, request.application_work_mode].filter(Boolean).join(" · ")}</dd></div> : null}
            {!careerApplication ? <div><dt>Guests</dt><dd>{request.guest_count ?? "Not provided"}</dd></div> : null}
            {!careerApplication ? <div><dt>Booking</dt><dd>{request.booking ? <Link href={`/admin/bookings/${request.booking.id}`}>{request.booking.booking_number}</Link> : "Not created"}</dd></div> : null}
            {!careerApplication ? <div><dt>Payment method</dt><dd>{request.payment_method === "vodafone_cash" ? "Vodafone Cash" : request.payment_method === "instapay" ? "InstaPay" : "Not submitted"}</dd></div> : null}
          </dl>
          <div className="pi-admin-contact-actions">
            {whatsappNumber ? <a href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noreferrer">Message on WhatsApp</a> : null}
            {request.customer?.email ? <a href={`mailto:${request.customer.email}?subject=${encodeURIComponent(`Planet Infinity · ${request.request_number}`)}`}>Send email</a> : null}
          </div>
          {paymentProofUrl ? <div className="pi-admin-payment-proof"><h3>Uploaded payment receipt</h3><a href={paymentProofUrl} target="_blank" rel="noreferrer"><Image src={paymentProofUrl} width={900} height={900} unoptimized alt={`Payment receipt for ${request.request_number}`} /></a><p>Review the receiving account before recording this payment. The uploaded image alone is not proof of a successful transfer.</p></div> : null}
          {privatePhotos.length ? <div className="pi-admin-payment-proof"><h3>{request.selections.applicationPhotos ? "Trip application photos" : "Candidate photos"}</h3><div className="pi-admin-gallery-list">{privatePhotos.map((photo) => <a key={photo.url} href={photo.url} target="_blank" rel="noreferrer"><Image className="pi-admin-gallery-preview" src={photo.url} width={640} height={640} unoptimized alt={photo.name} /></a>)}</div><p>Private uploads. These links expire after ten minutes.</p></div> : null}
          {recruitmentUploads.length ? <div className="pi-admin-payment-proof"><h3>Candidate photo</h3><div className="pi-admin-gallery-list">{recruitmentUploads.map((file) => <a key={file.url} href={file.url} target="_blank" rel="noreferrer"><Image className="pi-admin-gallery-preview" src={file.url} width={640} height={640} unoptimized alt={file.name} /></a>)}</div><p>Private upload. This link expires after ten minutes.</p></div> : null}
          {careerAnswers.length ? <div className="pi-admin-submitted-answers"><h3>Career application answers</h3><dl className="pi-admin-details">{careerAnswers.map((answer, index) => <div key={`${answer.label}-${index}`}><dt>{answer.label}</dt><dd>{answer.answer}</dd></div>)}</dl></div> : null}
          {!careerApplication && tripAnswers.length ? <div className="pi-admin-submitted-answers"><h3>Trip-specific answers</h3><dl className="pi-admin-details">{tripAnswers.map((answer, index) => <div key={`${answer.label}-${index}`}><dt>{answer.label}</dt><dd>{answer.answer}</dd></div>)}</dl></div> : null}
          {submittedDetails.length || request.notes ? <div className="pi-admin-submitted-answers"><h3>Submitted details</h3><dl className="pi-admin-details">
            {submittedDetails.map((detail) => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.answer}</dd></div>)}
            {request.notes ? <div><dt>Notes</dt><dd>{request.notes}</dd></div> : null}
          </dl></div> : null}
        </section>
        <aside className="pi-admin-section"><h2>{careerApplication ? "Update application" : "Update request"}</h2>{careerApplication ? <ApplicationStatusForm requestId={request.id} currentStatus={request.application_status} currentNote={request.admin_note} /> : <RequestStatusForm requestId={request.id} currentStatus={request.status} currentNote={request.admin_note} />}{!careerApplication ? <><h3>Convert to booking</h3>{request.booking ? <p className="pi-admin-success">This request is linked to {request.booking.booking_number}.</p> : <RequestToBookingForm requestId={request.id} disabled={request.request_type === "application" || request.status !== "accepted"} />}</> : null}</aside>
      </div>
      {!careerApplication ? <section className="pi-admin-section"><div className="pi-admin-section__head"><div><p className="pi-admin-kicker">History</p><h2>Status changes</h2></div></div>
        {history.length ? <ol className="pi-admin-history">{history.map((item) => <li key={item.id}><strong>{item.from_status ? `${item.from_status} → ${item.to_status}` : item.to_status}</strong><span>{formatDate(item.created_at)}</span>{item.note ? <p>{item.note}</p> : null}</li>)}</ol> : <div className="pi-admin-empty">No status changes yet.</div>}
      </section> : null}
    </AdminShell>
  );
}
