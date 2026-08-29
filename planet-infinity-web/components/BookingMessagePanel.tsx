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
  bookingTitle,
  guestCount,
  totalAmount,
  confirmationIssued,
}: {
  bookingNumber: string;
  customerName: string;
  phone: string | null;
  paymentUrl: string;
  bookingTitle: string;
  guestCount: number;
  totalAmount: number;
  confirmationIssued: boolean;
}) {
  const initial = confirmationIssued
    ? `Hello ${customerName}, your Planet Infinity Booking Confirmation is ready.\n\nBooking: ${bookingNumber}\nExperience: ${bookingTitle}\nGuests: ${guestCount}\nAmount recorded: ${totalAmount.toLocaleString("en-EG")} EGP\nStatus: Confirmed\n\nYour Booking Confirmation PDF is attached to this message. Please keep it for your records.\n\nThank you,\nPlanet Infinity`
    : `Hello ${customerName}, this is Planet Infinity regarding booking ${bookingNumber}. Your booking is awaiting payment verification. You can review the balance and payment instructions here: ${paymentUrl}`;
  const [message, setMessage] = useState(initial);
  const number = whatsappNumber(phone);

  async function copy() {
    await navigator.clipboard.writeText(message);
  }

  return (
    <section className="pi-admin-message-panel">
      <h3>Message this customer</h3>
      <p className="pi-admin-help">
        {confirmationIssued
          ? "This is the final confirmation message. Download the PDF above, attach it in WhatsApp, then send this message."
          : "Manual messages are available for every booking. WhatsApp opt-in only affects automatic template delivery; it does not block your team from opening a chat."}
      </p>
      <textarea aria-label="WhatsApp message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1500} />
      <div className="pi-admin-confirmation-actions">
        <button type="button" className="pi-admin-button pi-admin-button--secondary" onClick={copy}>Copy message</button>
        {number ? <a className="pi-admin-button" href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Open WhatsApp chat</a> : <p className="pi-admin-error">No phone number was saved for this customer.</p>}
      </div>
    </section>
  );
}
