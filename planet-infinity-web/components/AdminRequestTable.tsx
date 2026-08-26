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
    <div className="pi-admin-table-wrap">
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
  );
}
