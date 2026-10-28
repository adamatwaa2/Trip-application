import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { documentTitle, INTERNAL_EVENT_DOCUMENTS_BUCKET, isDocumentFilename, isEventId } from "@/lib/internal-event-documents";
import { InternalEventDocumentUpload } from "./InternalEventDocumentUpload";
import styles from "./InternalEventDocuments.module.css";

export async function InternalEventDocuments({ eventId }: { eventId: string }) {
  await requireAdmin();
  if (!isEventId(eventId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(INTERNAL_EVENT_DOCUMENTS_BUCKET).list(eventId, { limit: 100, sortBy: { column: "name", order: "asc" } });
  const documents = (data || []).filter(file => file.id && isDocumentFilename(file.name));
  return <section className={styles.section} aria-labelledby="internal-event-documents">
    <div className={styles.heading}><h2 id="internal-event-documents">Internal documents / ملفات داخلية</h2><span className={styles.badge}>Admin only · خاص بالفريق</span></div>
    <p className={styles.description}>Private project files for your team. These files are not shown on the public event page and cannot be opened without admin access.</p>
    {error ? <p className={styles.error} role="alert">Could not load the internal PDFs. Please refresh and try again.</p> : documents.length ? <ul className={styles.list}>{documents.map(file => {
      const url = `/api/admin/events/${eventId}/internal-documents/${encodeURIComponent(file.name)}`;
      return <li className={styles.document} key={file.id}><strong>{documentTitle(file.name)}</strong><small>PDF{file.metadata?.size ? ` · ${Math.ceil(Number(file.metadata.size) / 1024)} KB` : ""}</small><div className={styles.links}><a href={url} target="_blank" rel="noopener noreferrer">Open PDF</a><a href={`${url}?download=1`}>Download</a></div></li>;
    })}</ul> : <p>No internal PDFs yet.</p>}
    <InternalEventDocumentUpload eventId={eventId} />
  </section>;
}
