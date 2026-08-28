"use client";

import { useState } from "react";

function whatsappNumber(value: string | null) {
  return (value ?? "").replace(/\D/g, "").replace(/^0/, "20");
}

export function BookingMessagePanel({
  bookingNumber,
  customerName,
  phone,
  paymentUrl,
  confirmationIssued,
}: {
  bookingNumber: string;
  customerName: string;
  phone: string | null;
  paymentUrl: string;
  confirmationIssued: boolean;
}) {
  const initial = confirmationIssued
    ? `Hello ${customerName}, your Planet Infinity Booking Confirmation for ${bookingNumber} is ready. We will share the PDF with you here. Thank you.`
    : `Hello ${customerName}, this is Planet Infinity regarding booking ${bookingNumber}. You can review your booking and payment status here: ${paymentUrl}`;
  const [message, setMessage] = useState(initial);
  const number = whatsappNumber(phone);

  async function copy() {
    await navigator.clipboard.writeText(message);
  }

  return (
    <section className="pi-admin-message-panel">
      <h3>Message this customer</h3>
      <p className="pi-admin-help">Manual messages are available for every booking. WhatsApp opt-in only affects automatic template delivery; it does not block your team from opening a chat.</p>
      <textarea aria-label="WhatsApp message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1500} />
      <div className="pi-admin-confirmation-actions">
        <button type="button" className="pi-admin-button pi-admin-button--secondary" onClick={copy}>Copy message</button>
        {number ? <a className="pi-admin-button" href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Open WhatsApp chat</a> : <p className="pi-admin-error">No phone number was saved for this customer.</p>}
      </div>
    </section>
  );
}
