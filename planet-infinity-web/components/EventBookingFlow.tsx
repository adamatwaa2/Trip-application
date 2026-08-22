"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  eventBookingSteps,
  quantityLimits,
  EVENT_STEP_LABELS,
  type EventBookingStep,
  type PlanetEvent,
} from "@/content/events";
import { Button } from "./Button";
import { EventConfirmation } from "./EventConfirmation";
import { EventQuantity } from "./EventQuantity";
import { EventTicketSelection } from "./EventTicketSelection";

/**
 * Front-end event booking flow. Separate from the trip flow by design: the
 * two products have different steps and different vocabulary, and there is no
 * seat step here at all.
 *
 * Steps come from eventBookingSteps(event):
 *
 *   simple booking      →  details → guest → review → confirmation
 *   ticket selection    →  details → tickets → guest → review → …
 *   tickets + quantity  →  details → tickets → quantity → guest → review → …
 *   application         →  details → request → confirmation
 *
 * Nothing submits, saves, emails or charges. Preview only.
 */
export function EventBookingFlow({ event }: { event: PlanetEvent }) {
  const steps = useMemo(() => eventBookingSteps(event), [event]);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);

  const [ticketId, setTicketId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const step = steps[stepIndex];
  const ticket = event.ticketOptions?.find((option) => option.id === ticketId);
  const limits = quantityLimits(event, ticket);

  const total = useMemo(() => {
    const unit = ticket?.priceEgp ?? event.priceEgp;
    if (unit === undefined) return undefined;
    return unit * (event.quantityEnabled ? quantity : 1);
  }, [ticket, event, quantity]);

  function canContinue(current: EventBookingStep): boolean {
    if (current === "tickets") return ticketId !== null;
    if (current === "quantity") {
      return quantity >= limits.min && quantity <= limits.max;
    }
    if (current === "guest" || current === "application") {
      return guestName.trim() !== "" && guestEmail.trim() !== "" && agreed;
    }
    return true;
  }

  if (done) {
    return (
      <EventConfirmation
        details={{
          eventTitle: event.title,
          category: event.category,
          dateLabel: event.eventDate,
          timeLabel: event.startTime,
          venue: event.venue,
          ticketLabel: event.ticketSelectionEnabled ? ticket?.label : undefined,
          quantity: event.quantityEnabled ? quantity : undefined,
          guestName,
          guestEmail,
          guestPhone,
          totalEgp: total,
          mode: event.bookingMode,
        }}
      />
    );
  }

  return (
    <div className="pi-flow">
      <ol className="pi-flow__steps">
        {steps.map((s, index) => (
          <li
            key={s}
            className={[
              "pi-flow__step",
              index === stepIndex ? "pi-flow__step--current" : null,
              index < stepIndex ? "pi-flow__step--done" : null,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-current={index === stepIndex ? "step" : undefined}
          >
            <span className="pi-flow__step-num">{index + 1}</span>
            {EVENT_STEP_LABELS[s]}
          </li>
        ))}
      </ol>

      <div className="pi-flow__panel">
        {step === "tickets" && event.ticketOptions ? (
          <>
            <h2 className="pi-flow__title">{EVENT_STEP_LABELS.tickets}</h2>
            <EventTicketSelection
              options={event.ticketOptions}
              value={ticketId}
              onChange={(id) => {
                setTicketId(id);
                const next = quantityLimits(
                  event,
                  event.ticketOptions?.find((o) => o.id === id)
                );
                setQuantity(next.min);
              }}
            />
          </>
        ) : null}

        {step === "quantity" ? (
          <>
            <h2 className="pi-flow__title">{EVENT_STEP_LABELS.quantity}</h2>
            <p className="pi-flow__hint">
              {ticket ? ticket.label : "Tickets"} — choose how many places you
              need.
            </p>
            <EventQuantity
              value={quantity}
              min={limits.min}
              max={limits.max}
              onChange={setQuantity}
              availableNote={
                ticket?.availableQuantity !== undefined
                  ? `${ticket.availableQuantity} left.`
                  : undefined
              }
            />
          </>
        ) : null}

        {step === "guest" || step === "application" ? (
          <>
            <h2 className="pi-flow__title">
              {step === "application"
                ? EVENT_STEP_LABELS.application
                : EVENT_STEP_LABELS.guest}
            </h2>
            {step === "application" ? (
              <p className="pi-flow__hint">
                This event is curated. Send a request and we come back to you
                either way — nothing is held or charged in the meantime.
              </p>
            ) : null}

            <label htmlFor="guestName">Full name</label>
            <input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />

            <label htmlFor="guestEmail">Email</label>
            <input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />

            <label htmlFor="guestPhone">
              Mobile / WhatsApp <span className="opt">(optional)</span>
            </label>
            <input
              id="guestPhone"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
            />

            {step === "application" ? (
              <>
                <label htmlFor="message">
                  Anything we should know? <span className="opt">(optional)</span>
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </>
            ) : null}

            <div className="agree-row">
              <input
                id="agreeTerms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="agreeTerms">
                I have read and agree to the Booking Terms &amp; Guest Policies
                <span className="placeholder-note">
                  The policy pages are not published yet.
                </span>
              </label>
            </div>
          </>
        ) : null}

        {step === "review" ? (
          <>
            <h2 className="pi-flow__title">{EVENT_STEP_LABELS.review}</h2>
            <dl className="pi-review">
              <div>
                <dt>Event</dt>
                <dd>{event.title}</dd>
              </div>
              {event.ticketSelectionEnabled ? (
                <div>
                  <dt>Ticket</dt>
                  <dd>{ticket?.label ?? "—"}</dd>
                </div>
              ) : null}
              {event.quantityEnabled ? (
                <div>
                  <dt>Tickets</dt>
                  <dd>{quantity}</dd>
                </div>
              ) : null}
              <div>
                <dt>Guest</dt>
                <dd>{guestName || "—"}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  {guestEmail || "—"}
                  {guestPhone ? ` · ${guestPhone}` : ""}
                </dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>
                  {total !== undefined
                    ? `${total.toLocaleString("en-US")} EGP`
                    : "Price not set"}
                </dd>
              </div>
            </dl>
            <p className="pi-flow__hint">
              Sending this confirms nothing. Nothing is charged and nothing is
              saved — this is a front-end preview.
            </p>
          </>
        ) : null}
      </div>

      <div className="pi-flow__actions">
        {stepIndex > 0 ? (
          <Button variant="secondary" onClick={() => setStepIndex((i) => i - 1)}>
            Back
          </Button>
        ) : (
          <Link
            href={`/events/${event.slug}`}
            className="pi-btn pi-btn--secondary"
          >
            Back to event
          </Link>
        )}

        {stepIndex < steps.length - 1 ? (
          <Button
            disabled={!canContinue(step)}
            onClick={() => setStepIndex((i) => i + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button disabled={!canContinue(step)} onClick={() => setDone(true)}>
            {event.bookingMode === "booking"
              ? "Get tickets"
              : event.bookingMode === "application"
                ? "Request access"
                : "Request to book"}
          </Button>
        )}
      </div>
    </div>
  );
}
