import Link from "next/link";
import {
  formatDate,
  requestSubject,
  requestTypeLabel,
  type AdminRequest,
} from "@/lib/admin-requests";

export function AdminRequestTable({ requests }: { requests: AdminRequest[] }) {
  if (requests.length === 0) {
    return <div className="pi-admin-empty">No requests match this view.</div>;
  }

  return (
    <>
      <div className="pi-admin-table-wrap pi-admin-desktop-list">
        <table className="pi-admin-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Guest</th>
            <th>Request</th>
            <th>Status</th>
            <th>Received</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td><Link href={`/admin/requests/${request.id}`}>{request.request_number}</Link></td>
              <td><strong>{request.customer?.full_name ?? "Unknown customer"}</strong><span>{request.customer?.email ?? "No email"}</span></td>
              <td>
                <strong>{requestTypeLabel(request.request_type)}</strong>
                <span>{requestSubject(request)}</span>
              </td>
              <td><span className={`pi-admin-status pi-admin-status--${request.status}`}>{request.status}</span></td>
              <td>{formatDate(request.created_at)}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      <div className="pi-admin-mobile-list" aria-label="Requests">
        {requests.map((request) => (
          <Link className="pi-admin-mobile-card" href={`/admin/requests/${request.id}`} key={request.id}>
            <div className="pi-admin-mobile-card__head">
              <strong>{request.request_number}</strong>
              <span className={`pi-admin-status pi-admin-status--${request.status}`}>{request.status}</span>
            </div>
            <h2>{request.customer?.full_name ?? "Unknown customer"}</h2>
            <p>{requestTypeLabel(request.request_type)} · {requestSubject(request)}</p>
            <span>{request.customer?.email ?? "No email"}</span>
            <footer><span>{formatDate(request.created_at)}</span><b>Review request →</b></footer>
          </Link>
        ))}
      </div>
    </>
  );
}
