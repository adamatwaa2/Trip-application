import Link from "next/link";
import { getRecruitmentRole } from "@/content/recruitment";
import { formatDate, type AdminRequest } from "@/lib/admin-requests";

function roleTitle(item: AdminRequest) {
  return getRecruitmentRole(item.application_category ?? "", item.application_role ?? "")?.title
    ?? item.application_role
    ?? "Legacy application";
}

export function AdminApplicationTable({ applications }: { applications: AdminRequest[] }) {
  if (!applications.length) return <div className="pi-admin-empty">No applications match this view.</div>;
  return <>
    <div className="pi-admin-table-wrap pi-admin-desktop-list"><table className="pi-admin-table"><thead><tr><th>Applicant</th><th>Application</th><th>Location</th><th>Status</th><th>Received</th></tr></thead><tbody>
      {applications.map((item) => <tr key={item.id}>
        <td><Link href={`/admin/requests/${item.id}`}>{item.customer?.full_name ?? "Unknown"}</Link><span>{item.customer?.email}</span></td>
        <td><strong>{roleTitle(item)}</strong><span>{[item.application_category, item.application_world].filter(Boolean).join(" · ") || "Earlier careers form"}</span></td>
        <td><strong>{[item.application_city, item.application_country].filter(Boolean).join(", ") || "Not provided"}</strong><span>{item.application_work_mode}</span></td>
        <td><span className={`pi-admin-status pi-admin-status--${item.application_status ?? "new"}`}>{item.application_status ?? "new"}</span></td>
        <td>{formatDate(item.created_at)}</td>
      </tr>)}
    </tbody></table></div>
    <div className="pi-admin-mobile-list">{applications.map((item) => <Link className="pi-admin-mobile-card" href={`/admin/requests/${item.id}`} key={item.id}><div className="pi-admin-mobile-card__head"><strong>{item.request_number}</strong><span className={`pi-admin-status pi-admin-status--${item.application_status ?? "new"}`}>{item.application_status ?? "new"}</span></div><h2>{item.customer?.full_name ?? "Unknown"}</h2><p>{roleTitle(item)}</p><span>{[item.application_world, item.application_country].filter(Boolean).join(" · ")}</span><footer><span>{formatDate(item.created_at)}</span><b>Review →</b></footer></Link>)}</div>
  </>;
}
