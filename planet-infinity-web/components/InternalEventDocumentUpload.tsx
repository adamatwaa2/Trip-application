"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./InternalEventDocuments.module.css";

export function InternalEventDocumentUpload({ eventId }: { eventId: string }) {
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    busy.current = true;
    setPending(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/events/${eventId}/internal-documents`, { method: "POST", body: new FormData(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed. Please try again.");
      form.reset();
      setMessage("PDF saved privately. Only active admins can open it.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed. Please try again.");
    } finally { busy.current = false; setPending(false); }
  }

  return <form className={styles.upload} onSubmit={upload}>
    <label htmlFor={`internal-pdf-${eventId}`}>Add an internal PDF<input id={`internal-pdf-${eventId}`} type="file" name="file" accept="application/pdf,.pdf" required disabled={pending} aria-describedby={`internal-pdf-help-${eventId}`} /></label>
    <small id={`internal-pdf-help-${eventId}`}>PDF only, up to 4 MB. This does not change the public trip/event document.</small>
    <button type="submit" disabled={pending}>{pending ? "Saving privately…" : "Upload internal PDF"}</button>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {message ? <p className={styles.success} role="status">{message}</p> : null}
  </form>;
}
