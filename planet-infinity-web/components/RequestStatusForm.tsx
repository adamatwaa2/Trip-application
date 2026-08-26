"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRequestStatus, type RequestStatus } from "@/app/actions/requests";

const statuses: { value: RequestStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "confirmed", label: "Confirmed" },
];

export function RequestStatusForm({
  requestId,
  currentStatus,
  currentNote,
}: {
  requestId: string;
  currentStatus: RequestStatus;
  currentNote: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<RequestStatus>(currentStatus);
  const [note, setNote] = useState(currentNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateRequestStatus(requestId, status, note);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Status updated.");
      router.refresh();
    });
  }

  return (
    <form className="pi-admin-status-form" onSubmit={submit}>
      <label htmlFor="request-status">Status</label>
      <select
        id="request-status"
        value={status}
        disabled={pending}
        onChange={(event) => setStatus(event.target.value as RequestStatus)}
      >
        {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <label htmlFor="request-note">Internal note</label>
      <textarea
        id="request-note"
        value={note}
        maxLength={2000}
        disabled={pending}
        onChange={(event) => setNote(event.target.value)}
      />
      {message ? <p className={message === "Status updated." ? "pi-admin-success" : "pi-admin-error"}>{message}</p> : null}
      <button className="pi-admin-button" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save update"}
      </button>
    </form>
  );
}
