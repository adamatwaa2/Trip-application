import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { getBookings } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin bookings" };

export default async function BookingsPage() {
  const profile = await requireAdmin();
  const result = await getBookings();
  const groups = new Map<string, { kind: "trip" | "event"; id: string; title: string; items: typeof result.items }>();
  for (const item of result.items) {
    const product = item.booking_type === "trip" ? item.trip : item.event;
    if (!product) continue;
    const key = `${item.booking_type}:${product.id}`;
    const group = groups.get(key) ?? { kind: item.booking_type, id: product.id, title: product.title, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }

  return (
    <AdminShell profile={profile} current="/admin/bookings">
      <header className="pi-admin-page-head">
        <p className="pi-admin-kicker">Bookings</p>
        <h1>Bookings, sorted by experience.</h1>
        <p>Each trip and event has its own operational list, customer details and Excel export.</p>
      </header>
      <section className="pi-admin-section">
        {result.error ? <p className="pi-admin-error">{result.error}</p> : groups.size ? (
          <div className="pi-admin-booking-groups">
            {Array.from(groups.values()).map((group) => {
              const paid = group.items.reduce((sum, item) => sum + Number(item.amount_paid), 0);
              const total = group.items.reduce((sum, item) => sum + Number(item.total_amount), 0);
              return <Link className="pi-admin-booking-group" href={`/admin/bookings/${group.kind}/${group.id}`} key={`${group.kind}-${group.id}`}>
                <div><p className="pi-admin-kicker">{group.kind}</p><h2>{group.title}</h2><p>{group.items.length} booking{group.items.length === 1 ? "" : "s"}</p></div>
                <dl><div><dt>Paid</dt><dd>{paid.toLocaleString("en-US")} EGP</dd></div><div><dt>Remaining</dt><dd>{Math.max(0, total - paid).toLocaleString("en-US")} EGP</dd></div></dl>
                <b>Open bookings →</b>
              </Link>;
            })}
          </div>
        ) : <div className="pi-admin-empty">No bookings yet. A direct booking will appear here as soon as the guest completes checkout.</div>}
      </section>
    </AdminShell>
  );
}
