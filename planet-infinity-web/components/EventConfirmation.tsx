import { Placeholder } from "./Placeholder";

export type EventConfirmationDetails = {
  eventTitle: string;
  category?: string;
  /** Written values only — never formatted from a date object. */
  dateLabel?: string;
  timeLabel?: string;
  venue?: string;
  /** The chosen ticket, when the event has a ticket step. */
  ticketLabel?: string;
  /** Only present when the event has a quantity step. */
  quantity?: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  totalEgp?: number;
  requestNumber?: string;
  mode: "booking" | "request" | "application";
};

/**
 * Event confirmation state.
 *
 * Shares the visual language of the trip confirmation but is its own
 * component, because the fields differ: tickets and quantity instead of
 * selections and seats.
 *
 * It shows the reference produced by the request inbox. Availability and
 * payment are confirmed later by the team.
 */
export function EventConfirmation({
  details,
}: {
  details: EventConfirmationDetails;
}) {
  const isApplication = details.mode === "application";
  const isRequest = details.mode !== "booking";

  return (
    <div className="pi-confirm">
      <div className="pi-confirm__mark" aria-hidden="true">
        ✓
      </div>
      <h2 className="pi-confirm__title">
        {isApplication ? "Request received" : isRequest ? "Request received" : "Booking received"}
      </h2>
      <p className="pi-confirm__lede">
        {isApplication
          ? "This is a curated event, so nothing is confirmed yet. We review every request and come back to you either way."
          : isRequest
            ? "Nothing is confirmed yet. We check availability and come back to you in writing."
            : "We have your booking. Written confirmation follows once payment is settled."}
      </p>

      <dl className="pi-confirm__grid">
        <div>
          <dt>Request reference</dt>
          <dd>{details.requestNumber ?? <Placeholder id="bookingReference" />}</dd>
        </div>
        <div>
          <dt>Event</dt>
          <dd>{details.eventTitle}</dd>
        </div>
        {details.category ? (
          <div>
            <dt>Category</dt>
            <dd>{details.category}</dd>
          </div>
        ) : null}
        <div>
          <dt>Date</dt>
          <dd>{details.dateLabel ?? <Placeholder id="eventDate" label="Not set" />}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{details.timeLabel ?? <Placeholder id="eventTime" label="Not set" />}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{details.venue ?? <Placeholder id="eventVenue" label="Not set" />}</dd>
        </div>
        {details.ticketLabel ? (
          <div>
            <dt>Ticket</dt>
            <dd>{details.ticketLabel}</dd>
          </div>
        ) : null}
        {details.quantity !== undefined ? (
          <div>
            <dt>Tickets</dt>
            <dd>{details.quantity}</dd>
          </div>
        ) : null}
        <div>
          <dt>Guest</dt>
          <dd>{details.guestName || "—"}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>
            {details.guestEmail || "—"}
            {details.guestPhone ? ` · ${details.guestPhone}` : ""}
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>
            {details.totalEgp !== undefined ? (
              `${details.totalEgp.toLocaleString("en-US")} EGP`
            ) : (
              <Placeholder id="ticketPrice" label="Price not set" />
            )}
          </dd>
        </div>
      </dl>

      <div className="pi-confirm__next">
        <h3>What happens next</h3>
        <ol>
          <li>We check the guest list and capacity for this event.</li>
          <li>We come back to you with whether your place is held.</li>
          <li>
            Anything payable is confirmed in writing before it is charged.
          </li>
        </ol>
      </div>

      <p className="pi-confirm__preview">
        Your request has been saved. There is no email, WhatsApp automation or payment step yet.
      </p>
    </div>
  );
}
