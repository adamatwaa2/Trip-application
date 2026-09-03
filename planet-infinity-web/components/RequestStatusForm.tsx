"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRequestStatus, type RequestStatus } from "@/app/actions/requests";
import { archiveRequest, restoreRequest } from "@/app/actions/admin-removal";

const statuses: { value: RequestStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Approved" },
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
  const [removalMessage, setRemovalMessage] = useState<string | null>(null);
  const [removalFailed, setRemovalFailed] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [pending, startTransition] = useTransition();

  function save(nextStatus: RequestStatus) {
    startTransition(async () => {
      setStatus(nextStatus);
      const result = await updateRequestStatus(requestId, nextStatus, note);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Status updated.");
      router.refresh();
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(status);
  }

  function archive() {
    setConfirmingArchive(false);
    startTransition(async () => {
      const result = await archiveRequest(requestId, note);
      setRemovalFailed(!result.ok);
      setRemovalMessage(result.ok ? result.message : result.error);
      if (result.ok) router.refresh();
    });
  }

  function restore() {
    startTransition(async () => {
      const result = await restoreRequest(requestId);
      setRemovalFailed(!result.ok);
      setRemovalMessage(result.ok ? result.message : result.error);
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      <form className="pi-admin-status-form" onSubmit={submit}>
        <div className="pi-admin-quick-actions" aria-label="Quick status actions">
          <button type="button" disabled={pending} onClick={() => save("accepted")}>Approve</button>
          <button type="button" disabled={pending} onClick={() => save("rejected")}>Reject</button>
          <button type="button" disabled={pending} onClick={() => save("confirmed")}>Confirm</button>
        </div>
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

      {/* Archiving only hides the request from the list. Nothing is deleted,
          and Restore puts it straight back — so a mis-click costs nothing. */}
      <div
        className="pi-admin-status-form"
        style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--pi-line)" }}
      >
        <label>Remove from the list</label>
        {confirmingArchive ? (
          <div className="pi-admin-quick-actions" aria-label="Confirm archive">
            <button type="button" disabled={pending} onClick={archive}>
              Yes, archive it
            </button>
            <button type="button" disabled={pending} onClick={() => setConfirmingArchive(false)}>
              Keep it
            </button>
          </div>
        ) : (
          <div className="pi-admin-quick-actions">
            <button type="button" disabled={pending} onClick={() => setConfirmingArchive(true)}>
              Archive this request
            </button>
            <button type="button" disabled={pending} onClick={restore}>
              Restore
            </button>
          </div>
        )}
        {removalMessage ? (
          <p className={removalFailed ? "pi-admin-error" : "pi-admin-success"}>{removalMessage}</p>
        ) : (
          <p className="pi-admin-help">
            Archiving hides it from the requests list. Nothing is deleted — Restore brings it back.
          </p>
        )}
      </div>
    </>
  );
}
