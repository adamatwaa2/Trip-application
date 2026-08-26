import Link from "next/link";
import { AdminRequestTable } from "@/components/AdminRequestTable";
import { AdminShell } from "@/components/AdminShell";
import { getRequests, requestStatuses } from "@/lib/admin-requests";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin requests" };

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireAdmin();
  const filters = await searchParams;
  const result = await getRequests(filters);
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "page") query.set(key, value);
  });
  const pageHref = (page: number) => `/admin/requests?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page) })}`;

  return (
    <AdminShell profile={profile} current="/admin/requests">
      <header className="pi-admin-page-head"><p className="pi-admin-kicker">Requests</p><h1>Every conversation starts here.</h1><p>{result.count} request{result.count === 1 ? "" : "s"} in this view.</p></header>
      <form className="pi-admin-filters" action="/admin/requests">
        <input name="query" defaultValue={filters.query} placeholder="Search reference or subject" aria-label="Search reference or subject" />
        <select name="type" defaultValue={filters.type || ""} aria-label="Request type">
          <option value="">All request types</option><option value="trip">Trip requests</option><option value="event">Event requests</option><option value="application">Applications</option>
        </select>
        <select name="status" defaultValue={filters.status || ""} aria-label="Status">
          <option value="">All statuses</option>{requestStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="pi-admin-button" type="submit">Apply filters</button>
        <Link href="/admin/requests">Clear</Link>
      </form>
      <section className="pi-admin-section">
        {result.error ? <p className="pi-admin-error">{result.error}</p> : <AdminRequestTable requests={result.requests} />}
        {result.count > result.pageSize ? <nav className="pi-admin-pagination" aria-label="Request pages">
          {result.page > 1 ? <Link href={pageHref(result.page - 1)}>Previous</Link> : <span />}
          <span>Page {result.page}</span>
          {result.page * result.pageSize < result.count ? <Link href={pageHref(result.page + 1)}>Next</Link> : <span />}
        </nav> : null}
      </section>
    </AdminShell>
  );
}
