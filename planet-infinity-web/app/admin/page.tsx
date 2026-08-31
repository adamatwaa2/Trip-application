import Link from "next/link";
import { AdminRequestTable } from "@/components/AdminRequestTable";
import { AdminShell } from "@/components/AdminShell";
import { getOverview, getRequests } from "@/lib/admin-requests";
import { getBookings, getPayments } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const profile = await requireAdmin();
  const [overview, latest, payments, bookings] = await Promise.all([getOverview(), getRequests(), getPayments(), getBookings()]);
  const recordedPayments = payments.items
    .filter((payment) => payment.status === "recorded")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const remainingToCollect = bookings.items
    .filter((booking) => booking.status !== "cancelled")
    .reduce((sum, booking) => sum + Math.max(0, Number(booking.total_amount || 0) - Number(booking.amount_paid || 0)), 0);
  const cards = [
    ["New requests", overview.pending, "/admin/requests?status=pending"],
    ["Bookings", overview.bookings, "/admin/bookings"],
    ["Payments recorded", `${recordedPayments.toLocaleString("en-US")} EGP`, "/admin/payments"],
    ["Remaining to collect", `${remainingToCollect.toLocaleString("en-US")} EGP`, "/admin/payments"],
  ];
  return (
    <AdminShell profile={profile} current="/admin">
      <header className="pi-admin-page-head"><p className="pi-admin-kicker">Overview</p><h1>The operation at a glance.</h1><p>Bookings, customer activity and money recorded — all in one private dashboard.</p></header>
      <section className="pi-admin-stats" aria-label="Operational and payment summary">
        {cards.map(([label, count, href]) => <Link href={href as string} key={label as string}><span>{label}</span><strong>{count}</strong></Link>)}
      </section>
      <section className="pi-admin-section">
        <div className="pi-admin-section__head"><div><p className="pi-admin-kicker">Latest</p><h2>Recent requests</h2></div><Link href="/admin/requests">View all</Link></div>
        {latest.error ? <p className="pi-admin-error">{latest.error}</p> : <AdminRequestTable requests={latest.requests.slice(0, 8)} />}
      </section>
    </AdminShell>
  );
}
