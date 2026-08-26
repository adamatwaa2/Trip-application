import { AdminShell } from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-requests";
import { getCustomers } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin customers" };
export default async function CustomersPage() {
  const profile = await requireAdmin(); const result = await getCustomers();
  return <AdminShell profile={profile} current="/admin/customers"><header className="pi-admin-page-head"><p className="pi-admin-kicker">Customers</p><h1>People, separate from Auth.</h1><p>Customer records are created from public requests; they are not administrator accounts.</p></header><section className="pi-admin-section">{result.error ? <p className="pi-admin-error">{result.error}</p> : result.items.length ? <div className="pi-admin-table-wrap"><table className="pi-admin-table"><thead><tr><th>Customer</th><th>Phone</th><th>Requests</th><th>Bookings</th><th>Joined</th></tr></thead><tbody>{result.items.map((item) => <tr key={item.id}><td><strong>{item.full_name}</strong><span>{item.email}</span></td><td>{item.phone ?? "—"}</td><td>{item.requests.length}</td><td>{item.bookings.length}</td><td>{formatDate(item.created_at)}</td></tr>)}</tbody></table></div> : <div className="pi-admin-empty">No customers yet.</div>}</section></AdminShell>;
}
