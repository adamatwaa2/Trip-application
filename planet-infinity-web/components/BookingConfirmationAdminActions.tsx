"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateBookingConfirmation,
  markBookingServicesConfirmed,
} from "@/app/actions/booking-confirmations";

export function BookingConfirmationAdminActions({
  bookingId,
  servicesConfirmed,
  fullyPaid,
  confirmationReady,
  confirmationIssued,
}: {
  bookingId: string;
  servicesConfirmed: boolean;
  fullyPaid: boolean;
  confirmationReady: boolean;
  confirmationIssued: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      setMessage(result.ok ? result.message : result.error);
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
        <a className="pi-admin-download" href={`/admin/bookings/${bookingId}/confirmation`}>
          Download current Booking Confirmation
        </a>
      ) : null}

      {message ? <p className={message.includes("could not") || message.includes("first") ? "pi-admin-error" : "pi-admin-success"}>{message}</p> : null}
    </div>
  );
}
