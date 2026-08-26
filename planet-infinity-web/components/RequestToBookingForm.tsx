"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { convertRequestToBooking } from "@/app/actions/requests";

export function RequestToBookingForm({ requestId, disabled }: { requestId: string; disabled: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (disabled) return <p className="pi-admin-empty">Accept this request before converting it to a booking.</p>;
  return <form className="pi-admin-status-form" onSubmit={(event) => {
    event.preventDefault(); setMessage(null);
    startTransition(async () => {
      const result = await convertRequestToBooking(requestId, Number(amount), note);
      if (!result.ok) { setMessage(result.error); return; }
      setMessage(`Booking ${result.bookingNumber} created.`); router.refresh();
    });
  }}>
    <label htmlFor="booking-total">Confirmed total (EGP)</label>
    <input id="booking-total" min="0" step="0.01" required type="number" value={amount} disabled={pending} onChange={(event) => setAmount(event.target.value)} />
    <label htmlFor="booking-note">Booking note</label>
    <textarea id="booking-note" maxLength={2000} value={note} disabled={pending} onChange={(event) => setNote(event.target.value)} />
    {message ? <p className={message.startsWith("Booking") ? "pi-admin-success" : "pi-admin-error"}>{message}</p> : null}
    <button className="pi-admin-button" disabled={pending} type="submit">{pending ? "Creating…" : "Create booking"}</button>
  </form>;
}
