import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { CustomerNotesForm } from "@/components/CustomerNotesForm";
import { requireAdmin } from "@/lib/admin";
import { getCustomer } from "@/lib/admin-operations";
import { formatDate } from "@/lib/admin-requests";
import { customerLastActivity, customerStage, customerSubject, customerTotals } from "@/lib/customer-crm";

export const metadata = { title: "Customer CRM record — Planet Infinity" };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireAdmin();
  const { id } = await params;
  const result = await getCustomer(id);
  if (!result.item) notFound();

  const customer = result.item;
  const stage = customerStage(customer);
  const totals = customerTotals(customer);
  const whatsappNumber = customer.phone?.replace(/\D/g, "") ?? "";
  const whatsappMessage = encodeURIComponent(`Hello ${customer.full_name}, this is Planet Infinity.`);

  return (
    <AdminShell profile={profile} current="/admin/customers">
      <header className="pi-admin-page-head pi-admin-detail-head">
        <div>
          <p className="pi-admin-kicker">Customer CRM</p>
          <h1>{customer.full_name}</h1>
          <p>{customerSubject(customer)} · last activity {formatDate(customerLastActivity(customer))}</p>
        </div>
        <Link href="/admin/customers">Back to customers</Link>
      </header>

      <section className="pi-admin-stats pi-admin-stats--crm" aria-label="Customer summary">
        <div><span>CRM stage</span><strong className={`pi-admin-status pi-admin-status--crm-${stage}`}>{stage}</strong></div>
        <div><span>Requests</span><strong>{customer.requests.length}</strong></div>
        <div><span>Bookings</span><strong>{customer.bookings.length}</strong></div>
        <div><span>Lifetime value</span><strong>{totals.value.toLocaleString("en-US")} <small>EGP</small></strong></div>
      </section>

      <div className="pi-admin-detail-grid">
        <section className="pi-admin-section">
          <div className="pi-admin-section__head"><h2>Profile</h2><span className={`pi-admin-status pi-admin-status--crm-${stage}`}>{stage}</span></div>
          <dl className="pi-admin-details">
            <div><dt>Name</dt><dd>{customer.full_name}</dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${customer.email}`}>{customer.email}</a></dd></div>
            <div><dt>Phone</dt><dd>{customer.phone ?? "Not provided"}</dd></div>
            <div><dt>Customer since</dt><dd>{formatDate(customer.created_at)}</dd></div>
            <div><dt>Booking value</dt><dd>{totals.value.toLocaleString("en-US")} EGP</dd></div>
            <div><dt>Amount paid</dt><dd>{totals.paid.toLocaleString("en-US")} EGP</dd></div>
          </dl>
          <div className="pi-admin-contact-actions">
            {whatsappNumber ? <a href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noreferrer">Message on WhatsApp</a> : null}
            <a href={`mailto:${customer.email}?subject=${encodeURIComponent("Planet Infinity")}`}>Send email</a>
          </div>
        </section>

        <aside className="pi-admin-section">
          <h2>CRM notes</h2>
          <p className="pi-admin-help">Private notes for preferences, follow-up context and future conversations.</p>
          <CustomerNotesForm customerId={customer.id} initialNotes={customer.notes} />
        </aside>
      </div>

      <section className="pi-admin-section">
        <div className="pi-admin-section__head"><h2>Requests</h2><span className="pi-admin-count">{customer.requests.length}</span></div>
        {customer.requests.length ? <div className="pi-admin-crm-timeline">{[...customer.requests].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((request) => (
          <Link href={`/admin/requests/${request.id}`} key={request.id}>
            <div><strong>{request.subject_title ?? "Planet Infinity application"}</strong><span>{request.request_number} · {formatDate(request.created_at)}</span></div>
            <span className={`pi-admin-status pi-admin-status--${request.status}`}>{request.status}</span>
          </Link>
        ))}</div> : <div className="pi-admin-empty">No requests from this customer.</div>}
      </section>

      <section className="pi-admin-section">
        <div className="pi-admin-section__head"><h2>Bookings</h2><span className="pi-admin-count">{customer.bookings.length}</span></div>
        {customer.bookings.length ? <div className="pi-admin-crm-timeline">{[...customer.bookings].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((booking) => (
          <Link href={`/admin/bookings/${booking.id}`} key={booking.id}>
            <div><strong>{booking.trip?.title ?? booking.event?.title ?? "Booking"}</strong><span>{booking.booking_number} · {formatDate(booking.scheduled_at ?? booking.created_at)}</span></div>
            <div className="pi-admin-crm-timeline__amount"><strong>{Number(booking.total_amount).toLocaleString("en-US")} EGP</strong><span>{Number(booking.amount_paid).toLocaleString("en-US")} paid</span></div>
            <span className={`pi-admin-status pi-admin-status--${booking.status}`}>{booking.status}</span>
          </Link>
        ))}</div> : <div className="pi-admin-empty">No bookings from this customer.</div>}
      </section>
    </AdminShell>
  );
}
