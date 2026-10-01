import Link from "next/link";
import { AdminApplicationTable } from "@/components/AdminApplicationTable";
import { AdminShell } from "@/components/AdminShell";
import { applicationStatuses, recruitmentCategories, recruitmentWorlds } from "@/content/recruitment";
import { requireAdmin } from "@/lib/admin";
import { getApplications } from "@/lib/admin-requests";

export const metadata = { title: "Admin applications" };
export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const profile = await requireAdmin();
  const filters = await searchParams;
  const result = await getApplications(filters);
  const exportQuery = new URLSearchParams(Object.entries(filters).filter((entry): entry is [string,string] => Boolean(entry[1])));
  const roles = recruitmentCategories.flatMap((category) => category.roles.map((role) => ({ ...role, category: category.title })));
  const pageHref = (page: number) => `/admin/applications?${new URLSearchParams({ ...Object.fromEntries(exportQuery), page: String(page) })}`;
  return <AdminShell profile={profile} current="/admin/applications">
    <header className="pi-admin-page-head"><p className="pi-admin-kicker">Crew applications</p><h1>Find the people who build worlds.</h1><p>{result.count} application{result.count === 1 ? "" : "s"} in this view.</p></header>
    <form className="pi-admin-filters pi-admin-filters--applications" action="/admin/applications">
      <input name="query" defaultValue={filters.query} placeholder="Name, email, role or reference" />
      <select name="category" defaultValue={filters.category || ""}><option value="">All categories</option>{recruitmentCategories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
      <select name="world" defaultValue={filters.world || ""}><option value="">All worlds</option>{recruitmentWorlds.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
      <select name="role" defaultValue={filters.role || ""}><option value="">All roles</option>{roles.map((role) => <option key={`${role.category}-${role.id}`} value={role.id}>{role.category} · {role.title}</option>)}</select>
      <input name="country" defaultValue={filters.country} placeholder="Country" />
      <select name="location" defaultValue={filters.location || ""}><option value="">Any work location</option><option value="egypt">Egypt-based</option><option value="remote">Remote</option></select>
      <select name="status" defaultValue={filters.status || ""}><option value="">All statuses</option>{applicationStatuses.map((item) => <option key={item}>{item}</option>)}</select>
      <button className="pi-admin-button">Filter</button><Link href="/admin/applications">Clear</Link><Link className="pi-admin-button pi-admin-download" href={`/admin/applications/export?${exportQuery}`}>Export CSV</Link>
    </form>
    <section className="pi-admin-section">{result.error ? <p className="pi-admin-error">{result.error}</p> : <AdminApplicationTable applications={result.applications} />}
      {result.count > result.pageSize ? <nav className="pi-admin-pagination" aria-label="Application pages">
        {result.page > 1 ? <Link href={pageHref(result.page - 1)}>Previous</Link> : <span />}
        <span>Page {result.page}</span>
        {result.page * result.pageSize < result.count ? <Link href={pageHref(result.page + 1)}>Next</Link> : <span />}
      </nav> : null}
    </section>
  </AdminShell>;
}
