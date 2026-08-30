import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-requests";
import { getBookings } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin bookings" };

export default async function BookingsPage() {
  const profile = await requireAdmin();
  const result = await getBookings();

  return (
    <AdminShell profile={profile} current="/admin/bookings">
      <header className="pi-admin-page-head">
        <p className="pi-admin-kicker">Bookings</p>
        <h1>Bookings and payment review.</h1>
        <p>Direct bookings arrive here immediately. Open any booking to review its customer, seats, receipt, payment and confirmation.</p>
        <p><a className="pi-admin-button pi-admin-download" href="/admin/export">Export all website data for Excel</a></p>
      </header>
      <section className="pi-admin-section">
        {result.error ? <p className="pi-admin-error">{result.error}</p> : result.items.length ? (
          <>
            <div className="pi-admin-table-wrap pi-admin-desktop-list">
              <table className="pi-admin-table">
                <thead><tr><th>Reference</th><th>Customer</th><th>Booking</th><th>Remaining</th><th>Status</th></tr></thead>
                <tbody>{result.items.map((item) => {
                  const subject = item.trip?.title ?? item.event?.title ?? item.booking_type;
                  const balance = Number(item.total_amount) - Number(item.amount_paid);
                  return <tr key={item.id}><td><Link href={`/admin/bookings/${item.id}`}>{item.booking_number}</Link></td><td><strong>{item.customer?.full_name ?? "Unknown"}</strong><span>{item.customer?.email}</span></td><td><strong>{subject}</strong><span>{formatDate(item.scheduled_at)}</span></td><td>{balance.toLocaleString("en-US")} EGP</td><td><span className={`pi-admin-status pi-admin-status--${item.status}`}>{item.status}</span></td></tr>;
                })}</tbody>
              </table>
            </div>
            <div className="pi-admin-mobile-list" aria-label="Bookings">
              {result.items.map((item) => {
                const subject = item.trip?.title ?? item.event?.title ?? item.booking_type;
                const balance = Number(item.total_amount) - Number(item.amount_paid);
                return (
                  <Link className="pi-admin-mobile-card" href={`/admin/bookings/${item.id}`} key={item.id}>
                    <div className="pi-admin-mobile-card__head"><strong>{item.booking_number}</strong><span className={`pi-admin-status pi-admin-status--${item.status}`}>{item.status}</span></div>
                    <h2>{item.customer?.full_name ?? "Unknown"}</h2>
                    <p>{subject}</p>
                    <span>{formatDate(item.scheduled_at)}</span>
                    <footer><span>{balance.toLocaleString("en-US")} EGP remaining</span><b>Review booking →</b></footer>
                  </Link>
                );
              })}
            </div>
          </>
        ) : <div className="pi-admin-empty">No bookings yet. A direct booking will appear here as soon as the guest completes checkout.</div>}
      </section>
    </AdminShell>
  );
}
