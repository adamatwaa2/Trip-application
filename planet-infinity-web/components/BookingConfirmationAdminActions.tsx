"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateBookingConfirmation,
  markBookingServicesConfirmed,
} from "@/app/actions/booking-confirmations";
import { archiveBooking, cancelBooking, restoreBooking } from "@/app/actions/admin-removal";

export function BookingConfirmationAdminActions({
  bookingId,
  bookingNumber,
  servicesConfirmed,
  fullyPaid,
  confirmationReady,
  confirmationIssued,
}: {
  bookingId: string;
  bookingNumber: string;
  servicesConfirmed: boolean;
  fullyPaid: boolean;
  confirmationReady: boolean;
  confirmationIssued: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelFailed, setCancelFailed] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      setMessage(result.ok ? result.message : result.error);
      if (result.ok) router.refresh();
    });
  }

  function runRemoval(task: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) {
    setConfirmingCancel(false);
    setConfirmingRemove(false);
    startTransition(async () => {
      const result = await task();
      setCancelFailed(!result.ok);
      setCancelMessage(result.ok ? result.message : result.error);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="pi-admin-confirmation-actions">
      <div className="pi-admin-checklist">
        <p className={fullyPaid ? "is-done" : ""}><span>{fullyPaid ? "✓" : "1"}</span> Full payment recorded</p>
        <p className={servicesConfirmed ? "is-done" : ""}><span>{servicesConfirmed ? "✓" : "2"}</span> Supplier services confirmed</p>
        <p className={confirmationIssued ? "is-done" : ""}><span>{confirmationIssued ? "✓" : "3"}</span> Confirmation PDF issued</p>
      </div>

      <button
        type="button"
        className="pi-admin-button"
        disabled={pending}
        onClick={() => run(() => markBookingServicesConfirmed(bookingId, !servicesConfirmed))}
      >
        {servicesConfirmed ? "Undo service confirmation" : "Confirm all services"}
      </button>

      <button
        type="button"
        className="pi-admin-button pi-admin-button--secondary"
        disabled={pending || !confirmationReady}
        onClick={() => run(() => generateBookingConfirmation(bookingId))}
      >
        {pending ? "Working…" : confirmationIssued ? "Regenerate confirmation PDF" : "Generate confirmation PDF"}
      </button>

      {!confirmationReady ? (
        <p className="pi-admin-help">The PDF unlocks only after full payment and service confirmation.</p>
      ) : null}

      {confirmationIssued ? (
        <a className="pi-admin-button pi-admin-download" href={`/admin/bookings/${bookingId}/confirmation`} download={`${bookingNumber}-confirmation.pdf`}>
          Download Booking Confirmation PDF
        </a>
      ) : null}

      {message ? <p className={message.includes("could not") || message.includes("first") ? "pi-admin-error" : "pi-admin-success"}>{message}</p> : null}

      {/* A booking is never deleted — it holds payments and a paper trail.
          Cancelling marks it cancelled and puts its seats back on sale. */}
      <div
        className="pi-admin-status-form"
        style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--pi-line)" }}
      >
        <label htmlFor={`cancel-reason-${bookingId}`}>Cancel or remove this booking</label>
        <input
          id={`cancel-reason-${bookingId}`}
          type="text"
          placeholder="Reason (optional) — customer cancelled, duplicate, test booking…"
          value={reason}
          maxLength={200}
          disabled={pending}
          onChange={(event) => setReason(event.target.value)}
        />

        {confirmingCancel ? (
          <div className="pi-admin-quick-actions" aria-label="Confirm cancellation">
            <button type="button" disabled={pending} onClick={() => runRemoval(() => cancelBooking(bookingId, reason))}>
              Yes, cancel {bookingNumber}
            </button>
            <button type="button" disabled={pending} onClick={() => setConfirmingCancel(false)}>
              Keep it
            </button>
          </div>
        ) : confirmingRemove ? (
          <div className="pi-admin-quick-actions" aria-label="Confirm removal">
            <button type="button" disabled={pending} onClick={() => runRemoval(() => archiveBooking(bookingId, reason))}>
              Yes, remove {bookingNumber}
            </button>
            <button type="button" disabled={pending} onClick={() => setConfirmingRemove(false)}>
              Keep it
            </button>
          </div>
        ) : (
          <div className="pi-admin-quick-actions">
            <button type="button" disabled={pending} onClick={() => setConfirmingCancel(true)}>
              Cancel booking
            </button>
            <button type="button" disabled={pending} onClick={() => setConfirmingRemove(true)}>
              Remove from list
            </button>
            <button type="button" disabled={pending} onClick={() => runRemoval(() => restoreBooking(bookingId))}>
              Restore
            </button>
          </div>
        )}

        {cancelMessage ? (
          <p className={cancelFailed ? "pi-admin-error" : "pi-admin-success"}>{cancelMessage}</p>
        ) : (
          <p className="pi-admin-help">
            <b>Cancel</b> keeps the booking on record, marks it cancelled and puts its seats back
            on sale. <b>Remove from list</b> just hides it — nothing is deleted, its payments stay,
            and <b>Restore</b> brings it back.
          </p>
        )}
      </div>
    </div>
  );
}
