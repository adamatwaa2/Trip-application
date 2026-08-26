import Link from "next/link";
import { AdminCatalogForm } from "@/components/AdminCatalogForm";
import { AdminShell } from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-requests";
import { getProducts } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin events" };

export default async function AdminEventsPage() {
  const profile = await requireAdmin();
  const result = await getProducts("events");

  return (
    <AdminShell profile={profile} current="/admin/events">
      <header className="pi-admin-page-head">
        <p className="pi-admin-kicker">Events</p>
        <h1>Manage event content.</h1>
        <p>
          Publish approved listings and decide independently whether each event needs
          an application first.
        </p>
      </header>

      <section className="pi-admin-section">
        <h2>Add event</h2>
        <AdminCatalogForm kind="events" />
      </section>

      <section className="pi-admin-section">
        <div className="pi-admin-section__head">
          <h2>Events</h2>
          <span className="pi-admin-count">{result.items.length} total</span>
        </div>
        {result.error ? (
          <p className="pi-admin-error">{result.error}</p>
        ) : result.items.length ? (
          <div className="pi-admin-table-wrap">
            <table className="pi-admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Starts</th>
                  <th>Price</th>
                  <th>Guest flow</th>
                  <th>Visibility</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <span>{item.slug}</span>
                    </td>
                    <td>{formatDate(item.starts_at)}</td>
                    <td>
                      {item.price_egp === null ? "Not set" : `${item.price_egp} EGP`}
                    </td>
                    <td>{item.application_required ? "Application" : "Standard"}</td>
                    <td>{item.is_published ? "Published" : "Draft"}</td>
                    <td>
                      <Link href={`/admin/events/${item.id}`}>Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pi-admin-empty">No events yet.</div>
        )}
      </section>
    </AdminShell>
  );
}
