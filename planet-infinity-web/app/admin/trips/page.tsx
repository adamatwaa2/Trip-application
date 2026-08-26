import Link from "next/link";
import { AdminCatalogForm } from "@/components/AdminCatalogForm";
import { AdminShell } from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-requests";
import { getProducts } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin trips" };

export default async function AdminTripsPage() {
  const profile = await requireAdmin();
  const result = await getProducts("trips");

  return (
    <AdminShell profile={profile} current="/admin/trips">
      <header className="pi-admin-page-head">
        <p className="pi-admin-kicker">Trips</p>
        <h1>Manage trip content.</h1>
        <p>
          Add the essentials now, then open a trip to manage its media, application,
          seat map and PDF.
        </p>
      </header>

      <section className="pi-admin-section">
        <h2>Add trip</h2>
        <AdminCatalogForm kind="trips" />
      </section>

      <section className="pi-admin-section">
        <div className="pi-admin-section__head">
          <h2>Trips</h2>
          <span className="pi-admin-count">{result.items.length} total</span>
        </div>
        {result.error ? (
          <p className="pi-admin-error">{result.error}</p>
        ) : result.items.length ? (
          <div className="pi-admin-table-wrap">
            <table className="pi-admin-table">
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>Departure</th>
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
                    <td>{formatDate(item.departure_at)}</td>
                    <td>
                      {item.price_egp === null ? "Not set" : `${item.price_egp} EGP`}
                    </td>
                    <td>
                      {[
                        item.application_required ? "Application" : null,
                        item.seat_selection_enabled ? "Seat choice" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Standard"}
                    </td>
                    <td>{item.is_published ? "Published" : "Draft"}</td>
                    <td>
                      <Link href={`/admin/trips/${item.id}`}>Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pi-admin-empty">No trips yet.</div>
        )}
      </section>
    </AdminShell>
  );
}
