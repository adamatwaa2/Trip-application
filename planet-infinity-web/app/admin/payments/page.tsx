import { AdminPaymentForm } from "@/components/AdminPaymentForm";
import { AdminShell } from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-requests";
import { getBookings, getPayments } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin payments" };
export default async function PaymentsPage() {
  const profile = await requireAdmin();
  const [payments, bookings] = await Promise.all([getPayments(), getBookings()]);
  const totalRecorded = payments.items.filter((item) => item.status === "recorded").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pendingReview = payments.items.filter((item) => item.status === "pending").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remaining = bookings.items.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + Math.max(0, Number(item.total_amount || 0) - Number(item.amount_paid || 0)), 0);
  const paidInFull = bookings.items.filter((item) => item.status !== "cancelled" && Number(item.total_amount || 0) > 0 && Number(item.amount_paid || 0) >= Number(item.total_amount || 0)).length;
  const cards = [["Payments recorded", totalRecorded], ["Pending review", pendingReview], ["Remaining to collect", remaining], ["Bookings paid in full", paidInFull]];
  return <AdminShell profile={profile} current="/admin/payments">
    <header className="pi-admin-page-head"><p className="pi-admin-kicker">Payments</p><h1>Manual now. Paymob-ready later.</h1><p>Track money received, pending proof and what is still due. Record an InstaPay, bank-transfer, cash or terminal payment only after you verify it.</p></header>
    <section className="pi-admin-stats" aria-label="Payment totals">{cards.map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{typeof value === "number" && label !== "Bookings paid in full" ? `${value.toLocaleString("en-US")} EGP` : value}</strong></div>)}</section>
    <section className="pi-admin-section"><h2>Record verified payment</h2><AdminPaymentForm bookings={bookings.items.map(({ id, booking_number }) => ({ id, booking_number }))} /></section>
    <section className="pi-admin-section"><h2>Payment history</h2>{payments.error ? <p className="pi-admin-error">{payments.error}</p> : payments.items.length ? <div className="pi-admin-table-wrap"><table className="pi-admin-table"><thead><tr><th>Booking</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead><tbody>{payments.items.map((item) => <tr key={item.id}><td>{item.booking?.booking_number ?? "Unknown"}</td><td><strong>{item.booking?.customer?.full_name ?? "Unknown"}</strong><span>{item.booking?.customer?.email}</span></td><td>{item.amount} EGP</td><td>{item.payment_method}</td><td><span className={`pi-admin-status pi-admin-status--${item.status}`}>{item.status}</span></td><td>{formatDate(item.received_at ?? item.created_at)}</td></tr>)}</tbody></table></div> : <div className="pi-admin-empty">No payments recorded.</div>}</section>
  </AdminShell>;
}
