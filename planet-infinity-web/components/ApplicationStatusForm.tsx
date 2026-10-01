"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationStatus } from "@/app/actions/recruitment";
import { applicationStatuses, type ApplicationStatus } from "@/content/recruitment";

export function ApplicationStatusForm({ requestId, currentStatus, currentNote }: { requestId: string; currentStatus: string | null; currentNote: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>((applicationStatuses.includes(currentStatus as ApplicationStatus) ? currentStatus : "new") as ApplicationStatus);
  const [note, setNote] = useState(currentNote ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return <form className="pi-admin-status-form" onSubmit={(event) => { event.preventDefault(); startTransition(async () => { const result = await updateApplicationStatus({ requestId, status, note }); setMessage(result.ok ? "Application updated." : result.error); if (result.ok) router.refresh(); }); }}>
    <label htmlFor="application-status">Hiring status</label>
    <select id="application-status" value={status} disabled={pending} onChange={(event) => setStatus(event.target.value as ApplicationStatus)}>{applicationStatuses.map((item) => <option value={item} key={item}>{item.replace("-", " ")}</option>)}</select>
    <label htmlFor="application-note">Internal note</label>
    <textarea id="application-note" value={note} maxLength={2000} disabled={pending} onChange={(event) => setNote(event.target.value)} />
    {message ? <p className={message === "Application updated." ? "pi-admin-success" : "pi-admin-error"}>{message}</p> : null}
    <button className="pi-admin-button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save application"}</button>
  </form>;
}
