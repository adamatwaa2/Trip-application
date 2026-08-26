"use client";

import { useState, useTransition } from "react";
import { recordPayment } from "@/app/actions/admin";

export function AdminPaymentForm({ bookings }: { bookings: { id: string; booking_number: string }[] }) {
  const [bookingId, setBookingId] = useState(bookings[0]?.id ?? ""); const [amount, setAmount] = useState(""); const [method, setMethod] = useState("instapay"); const [status, setStatus] = useState("recorded"); const [reference, setReference] = useState(""); const [message, setMessage] = useState<string | null>(null); const [pending, startTransition] = useTransition();
  if (!bookings.length) return <p className="pi-admin-empty">Create a confirmed booking before recording a payment.</p>;
  return <form className="pi-admin-form" onSubmit={(event) => { event.preventDefault(); setMessage(null); startTransition(async () => { const result = await recordPayment({ bookingId, amount: Number(amount), method, status, reference }); if (!result.ok) { setMessage(result.error); return; } setAmount(""); setReference(""); setMessage("Payment recorded."); }); }}>
    <label>Booking<select value={bookingId} onChange={(event) => setBookingId(event.target.value)}>{bookings.map((booking) => <option value={booking.id} key={booking.id}>{booking.booking_number}</option>)}</select></label>
    <div className="pi-admin-form__grid"><label>Amount (EGP)<input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>Method<select value={method} onChange={(event) => setMethod(event.target.value)}><option value="instapay">InstaPay</option><option value="vodafone_cash">Vodafone Cash</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="card_terminal">Card terminal</option><option value="other">Other</option></select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="recorded">Verified and recorded</option><option value="pending">Pending review</option><option value="void">Rejected / void</option></select></label></div>
    <label>Transfer reference <input maxLength={200} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Transaction or receipt reference" /></label>
    <p className="pi-admin-help">For InstaPay or bank transfer, choose “Verified and recorded” only after checking the transfer in the receiving account.</p>
    {message ? <p className={message === "Payment recorded." ? "pi-admin-success" : "pi-admin-error"}>{message}</p> : null}<button className="pi-admin-button" disabled={pending} type="submit">{pending ? "Saving…" : "Record payment"}</button>
  </form>;
}
