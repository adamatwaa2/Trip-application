import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-requests";
import { getBookings } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin bookings" };
export default async function BookingsPage() {
  const profile = await requireAdmin(); const result = await getBookings();
  return <AdminShell profile={profile} current="/admin/bookings"><header className="pi-admin-page-head"><p className="pi-admin-kicker">Bookings</p><h1>Bookings and payment review.</h1><p>Direct bookings arrive here immediately. Verify each uploaded receipt before marking its payment as recorded.</p></header><section className="pi-admin-section">{result.error ? <p className="pi-admin-error">{result.error}</p> : result.items.length ? <div className="pi-admin-table-wrap"><table className="pi-admin-table"><thead><tr><th>Reference</th><th>Customer</th><th>Booking</th><th>Balance</th><th>Status</th></tr></thead><tbody>{result.items.map((item) => { const subject = item.trip?.title ?? item.event?.title ?? item.booking_type; const balance = Number(item.total_amount) - Number(item.amount_paid); return <tr key={item.id}><td><Link href={`/admin/bookings/${item.id}`}>{item.booking_number}</Link></td><td><strong>{item.customer?.full_name ?? "Unknown"}</strong><span>{item.customer?.email}</span></td><td><strong>{subject}</strong><span>{formatDate(item.scheduled_at)}</span></td><td>{balance.toLocaleString("en-US")} EGP</td><td><span className={`pi-admin-status pi-admin-status--${item.status}`}>{item.status}</span></td></tr>; })}</tbody></table></div> : <div className="pi-admin-empty">No bookings yet. A direct booking will appear here as soon as the guest completes checkout.</div>}</section></AdminShell>;
}
