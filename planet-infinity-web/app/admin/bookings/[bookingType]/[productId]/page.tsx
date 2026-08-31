import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-requests";
import { getBookingsForProduct, getTripSeatOverview } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Experience bookings" };

export default async function ExperienceBookingsPage({ params }: { params: Promise<{ bookingType: string; productId: string }> }) {
  const profile = await requireAdmin();
  const { bookingType, productId } = await params;
  if (bookingType !== "trip" && bookingType !== "event") notFound();
  const result = await getBookingsForProduct(bookingType, productId);
  const first = result.items[0];
  if (!result.error && !first) notFound();
  const title = bookingType === "trip" ? first?.trip?.title : first?.event?.title;
  const paid = result.items.reduce((sum, item) => sum + Number(item.amount_paid), 0);
  const total = result.items.reduce((sum, item) => sum + Number(item.total_amount), 0);
  const departures = new Map<string, typeof result.items>();
  for (const item of result.items) {
    const key = item.scheduled_at ?? "unscheduled";
    const group = departures.get(key) ?? [];
    group.push(item);
    departures.set(key, group);
  }
  const seatOverview = bookingType === "trip" ? await getTripSeatOverview(productId, Array.from(departures.keys()).filter((key) => key !== "unscheduled")) : [];

  return <AdminShell profile={profile} current="/admin/bookings">
    <header className="pi-admin-page-head pi-admin-detail-head"><div><p className="pi-admin-kicker">{bookingType} bookings</p><h1>{title ?? "Experience"}</h1><p>{result.items.length} booking{result.items.length === 1 ? "" : "s"} · {paid.toLocaleString("en-US")} EGP paid · {Math.max(0, total - paid).toLocaleString("en-US")} EGP remaining</p></div><Link href="/admin/bookings">Back to experiences</Link></header>
    {result.error ? <section className="pi-admin-section"><p className="pi-admin-error">{result.error}</p></section> : Array.from(departures.entries()).map(([scheduledAt, items]) => {
      const seatsForDeparture = seatOverview.filter((seat) => seat.scheduledAt === scheduledAt);
      const exportHref = scheduledAt === "unscheduled" ? `/admin/bookings/${bookingType}/${productId}/export` : `/admin/bookings/${bookingType}/${productId}/export?scheduledAt=${encodeURIComponent(scheduledAt)}`;
      return <section className="pi-admin-section" key={scheduledAt}>
        <div className="pi-admin-section__head"><div><p className="pi-admin-kicker">Departure</p><h2>{scheduledAt === "unscheduled" ? "Date to be confirmed" : formatDate(scheduledAt)}</h2></div><a className="pi-admin-button pi-admin-download" href={exportHref}>Download Excel for this day</a></div>
        <p className="pi-admin-help">No email addresses are included. This day&apos;s file contains client contacts, guest roster, answers, payments and assigned seats.</p>
        {seatsForDeparture.length ? <div className="pi-admin-seat-overview">{seatsForDeparture.map((seat) => <div key={seat.vehicleId}><strong>{seat.vehicleLabel}</strong><span>{seat.reservedSeats} / {seat.sellableSeats} seats reserved · {seat.remainingSeats} left</span></div>)}</div> : null}
        <div className="pi-admin-table-wrap"><table className="pi-admin-table"><thead><tr><th>Reference</th><th>Customer</th><th>Guests</th><th>Paid / remaining</th><th>Status</th><th>Booked</th></tr></thead><tbody>{items.map((item) => {
          const remaining = Math.max(0, Number(item.total_amount) - Number(item.amount_paid));
          return <tr key={item.id}><td><Link href={`/admin/bookings/${item.id}`}>{item.booking_number}</Link></td><td><strong>{item.customer?.full_name ?? "Unknown"}</strong><span>{item.customer?.phone ?? item.customer?.email ?? "No contact"}</span></td><td>{item.guest_count}</td><td><strong>{Number(item.amount_paid).toLocaleString("en-US")} EGP</strong><span>{remaining.toLocaleString("en-US")} EGP remaining</span></td><td><span className={`pi-admin-status pi-admin-status--${item.status}`}>{item.status}</span></td><td>{formatDate(item.created_at)}</td></tr>;
        })}</tbody></table></div>
      </section>;
    })}
  </AdminShell>;
}
