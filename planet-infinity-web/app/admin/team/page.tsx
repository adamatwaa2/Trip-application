import { AdminShell } from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-requests";
import { getTeam } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin team" };
export default async function TeamPage() {
  const profile = await requireAdmin(); const result = await getTeam();
  return <AdminShell profile={profile} current="/admin/team"><header className="pi-admin-page-head"><p className="pi-admin-kicker">Admin team</p><h1>Access is explicit.</h1><p>Team members must first exist in Supabase Auth, then their UUID is added to <code>admin_users</code>. No public registration can create an administrator.</p></header><section className="pi-admin-section">{result.error ? <p className="pi-admin-error">{result.error}</p> : result.items.length ? <div className="pi-admin-table-wrap"><table className="pi-admin-table"><thead><tr><th>Name</th><th>Role</th><th>Access</th><th>Added</th></tr></thead><tbody>{result.items.map((item) => <tr key={item.id}><td>{item.full_name ?? "Unnamed administrator"}</td><td>{item.role}</td><td><span className={`pi-admin-status pi-admin-status--${item.is_active ? "confirmed" : "rejected"}`}>{item.is_active ? "active" : "inactive"}</span></td><td>{formatDate(item.created_at)}</td></tr>)}</tbody></table></div> : <div className="pi-admin-empty">No administrators have been assigned yet.</div>}<h3>Add an administrator safely</h3><p>Create the user in the new project&apos;s Supabase Auth dashboard, then add that user&apos;s UUID to <code>public.admin_users</code> in the SQL editor. This dashboard intentionally cannot create credentials.</p></section></AdminShell>;
}
