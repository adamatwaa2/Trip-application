import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { formatDate } from "@/lib/admin-requests";
import { getCustomers } from "@/lib/admin-operations";
import { customerLastActivity, customerStage, customerSubject, customerTotals, type CustomerStage } from "@/lib/customer-crm";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Customer CRM — Planet Infinity" };

const stages: { value: CustomerStage; label: string }[] = [
  { value: "lead", label: "Leads" },
  { value: "qualified", label: "Qualified" },
  { value: "booked", label: "Booked" },
  { value: "returning", label: "Returning" },
  { value: "closed", label: "Closed" },
];

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const profile = await requireAdmin();
  const filters = await searchParams;
  const result = await getCustomers();
  const query = (filters.query ?? "").trim().toLowerCase();
  const stage = stages.some((item) => item.value === filters.stage) ? filters.stage as CustomerStage : null;
  const items = result.items.filter((item) => {
    const searchable = `${item.full_name} ${item.email} ${item.phone ?? ""}`.toLowerCase();
    return (!query || searchable.includes(query)) && (!stage || customerStage(item) === stage);
  });
  const totalValue = result.items.reduce((sum, item) => sum + customerTotals(item).value, 0);
  const totalPaid = result.items.reduce((sum, item) => sum + customerTotals(item).paid, 0);
  const totalRemaining = Math.max(0, totalValue - totalPaid);

  return (
    <AdminShell profile={profile} current="/admin/customers">
      <header className="pi-admin-page-head">
        <p className="pi-admin-kicker">Customer CRM</p>
        <h1>People, history and follow-up.</h1>
        <p>Every request and booking rolls into one customer record, separate from administrator accounts.</p>
      </header>

      <section className="pi-admin-stats pi-admin-stats--crm" aria-label="CRM summary">
        <Link href="/admin/customers"><span>Total customers</span><strong>{result.items.length}</strong></Link>
        <Link href="/admin/customers?stage=lead"><span>Open leads</span><strong>{result.items.filter((item) => customerStage(item) === "lead").length}</strong></Link>
        <Link href="/admin/payments"><span>Payments recorded</span><strong>{totalPaid.toLocaleString("en-US")} EGP</strong></Link>
        <Link href="/admin/payments"><span>Still to collect</span><strong>{totalRemaining.toLocaleString("en-US")} EGP</strong></Link>
      </section>

      <form className="pi-admin-filters pi-admin-filters--crm" action="/admin/customers">
        <input name="query" defaultValue={filters.query} placeholder="Search name, email or phone" aria-label="Search customers" />
        <select name="stage" defaultValue={stage ?? ""} aria-label="CRM stage">
          <option value="">All CRM stages</option>
          {stages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button className="pi-admin-button" type="submit">Apply filters</button>
        <Link href="/admin/customers">Clear</Link>
      </form>

      <section className="pi-admin-section">
        <div className="pi-admin-section__head"><h2>{items.length} customer{items.length === 1 ? "" : "s"}</h2><span className="pi-admin-count">{totalValue.toLocaleString("en-US")} EGP total booking value</span></div>
        {result.error ? <p className="pi-admin-error">{result.error}</p> : items.length ? (
          <>
            <div className="pi-admin-table-wrap pi-admin-desktop-list"><table className="pi-admin-table"><thead><tr><th>Customer</th><th>Stage</th><th>Latest interest</th><th>Requests</th><th>Bookings</th><th>Booked / paid</th><th>Remaining</th><th>Last activity</th></tr></thead><tbody>{items.map((item) => {
              const totals = customerTotals(item); const itemStage = customerStage(item);
              return <tr key={item.id}><td><Link href={`/admin/customers/${item.id}`}>{item.full_name}</Link><span>{item.email}<br />{item.phone ?? "No phone"}</span></td><td><span className={`pi-admin-status pi-admin-status--crm-${itemStage}`}>{itemStage}</span></td><td>{customerSubject(item)}</td><td>{item.requests.length}</td><td>{item.bookings.length}</td><td>{totals.value.toLocaleString("en-US")} EGP<span>{totals.paid.toLocaleString("en-US")} paid</span></td><td>{Math.max(0, totals.value - totals.paid).toLocaleString("en-US")} EGP</td><td>{formatDate(customerLastActivity(item))}</td></tr>;
            })}</tbody></table></div>
            <div className="pi-admin-mobile-list" aria-label="Customers">{items.map((item) => {
              const totals = customerTotals(item); const itemStage = customerStage(item);
              return <Link className="pi-admin-mobile-card" href={`/admin/customers/${item.id}`} key={item.id}><div className="pi-admin-mobile-card__head"><strong>{item.full_name}</strong><span className={`pi-admin-status pi-admin-status--crm-${itemStage}`}>{itemStage}</span></div><p>{item.email}</p><p>{item.phone ?? "No phone"}</p><span>{customerSubject(item)}</span><footer><span>{item.requests.length} requests · {item.bookings.length} bookings · {totals.value.toLocaleString("en-US")} EGP</span><b>Open CRM →</b></footer></Link>;
            })}</div>
          </>
        ) : <div className="pi-admin-empty">No customers match these filters.</div>}
      </section>
    </AdminShell>
  );
}
