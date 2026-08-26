import { AdminPaymentForm } from "@/components/AdminPaymentForm";
import { AdminShell } from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-requests";
import { getBookings, getPayments } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin payments" };
export default async function PaymentsPage() {
  const profile = await requireAdmin(); const [payments, bookings] = await Promise.all([getPayments(), getBookings()]);
  return <AdminShell profile={profile} current="/admin/payments"><header className="pi-admin-page-head"><p className="pi-admin-kicker">Payments</p><h1>Manual now. Paymob-ready later.</h1><p>Record verified InstaPay, bank-transfer, cash, or terminal payments here. Paymob card payments will be verified automatically after its credentials are connected.</p></header><section className="pi-admin-section"><h2>Record verified payment</h2><AdminPaymentForm bookings={bookings.items.map(({ id, booking_number }) => ({ id, booking_number }))} /></section><section className="pi-admin-section"><h2>Payment history</h2>{payments.error ? <p className="pi-admin-error">{payments.error}</p> : payments.items.length ? <div className="pi-admin-table-wrap"><table className="pi-admin-table"><thead><tr><th>Booking</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead><tbody>{payments.items.map((item) => <tr key={item.id}><td>{item.booking?.booking_number ?? "Unknown"}</td><td><strong>{item.booking?.customer?.full_name ?? "Unknown"}</strong><span>{item.booking?.customer?.email}</span></td><td>{item.amount} EGP</td><td>{item.payment_method}</td><td><span className={`pi-admin-status pi-admin-status--${item.status}`}>{item.status}</span></td><td>{formatDate(item.received_at ?? item.created_at)}</td></tr>)}</tbody></table></div> : <div className="pi-admin-empty">No payments recorded.</div>}</section></AdminShell>;
}
