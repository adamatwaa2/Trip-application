import Link from "next/link";
import { AdminRequestTable } from "@/components/AdminRequestTable";
import { AdminShell } from "@/components/AdminShell";
import { getOverview, getRequests } from "@/lib/admin-requests";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const profile = await requireAdmin();
  const [overview, latest] = await Promise.all([getOverview(), getRequests()]);
  const cards = [
    ["All requests", overview.all, "/admin/requests"],
    ["Pending", overview.pending, "/admin/requests?status=pending"],
    ["Accepted", overview.accepted, "/admin/requests?status=accepted"],
    ["Bookings", overview.bookings, "/admin/bookings"],
  ];
  return (
    <AdminShell profile={profile} current="/admin">
      <header className="pi-admin-page-head"><p className="pi-admin-kicker">Overview</p><h1>The operation at a glance.</h1><p>Requests, bookings and payments remain connected without exposing customer data publicly.</p></header>
      <section className="pi-admin-stats" aria-label="Request counts">
        {cards.map(([label, count, href]) => <Link href={href as string} key={label as string}><span>{label}</span><strong>{count}</strong></Link>)}
      </section>
      <section className="pi-admin-section">
        <div className="pi-admin-section__head"><div><p className="pi-admin-kicker">Latest</p><h2>Recent requests</h2></div><Link href="/admin/requests">View all</Link></div>
        {latest.error ? <p className="pi-admin-error">{latest.error}</p> : <AdminRequestTable requests={latest.requests.slice(0, 8)} />}
      </section>
    </AdminShell>
  );
}
