import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCatalogForm } from "@/components/AdminCatalogForm";
import { AdminShell } from "@/components/AdminShell";
import { getProduct } from "@/lib/admin-operations";
import { requireAdmin } from "@/lib/admin";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Edit admin event" };

export default async function AdminEventEditPage({ params }: Props) {
  const profile = await requireAdmin();
  const { id } = await params;
  const item = await getProduct("events", id);
  if (!item) notFound();

  return (
    <AdminShell profile={profile} current="/admin/events">
      <header className="pi-admin-page-head pi-admin-detail-head">
        <div>
          <p className="pi-admin-kicker">Edit event</p>
          <h1>{item.title}</h1>
          <p>Changes update the public event after you save them.</p>
        </div>
        <Link href="/admin/events">Back to events</Link>
      </header>

      <section className="pi-admin-section">
        <AdminCatalogForm kind="events" item={item} />
      </section>
    </AdminShell>
  );
}
