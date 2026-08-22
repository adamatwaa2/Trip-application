import { Placeholder } from "./Placeholder";

export type ConfirmationDetails = {
  tripTitle: string;
  /** Chosen option labels, in group order. Empty when selection is off. */
  selections?: string[];
  /** Only present when the trip enables seat booking. */
  seat?: number | null;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCount?: number;
  totalEgp?: number;
  /** "request" produces a request reference, not a booking reference. */
  mode: "booking" | "request" | "application";
};

/**
 * Reusable confirmation state.
 *
 * It is capable of showing a reference, statuses and next steps — but it
 * INVENTS NOTHING. The booking reference and both statuses render as
 * placeholders, because no booking has actually been made: there is no
 * backend, nothing was submitted, and no payment exists.
 */
export function BookingConfirmation({ details }: { details: ConfirmationDetails }) {
  const isRequest = details.mode !== "booking";

  return (
    <div className="pi-confirm">
      <div className="pi-confirm__mark" aria-hidden="true">
        ✓
      </div>
      <h2 className="pi-confirm__title">
        {isRequest ? "Request received" : "Booking received"}
      </h2>
      <p className="pi-confirm__lede">
        {isRequest
          ? "Nothing is confirmed yet. We check availability with our suppliers and come back to you — a request is not a booking until we issue a written confirmation."
          : "We have your booking. The written confirmation follows once payment is settled."}
      </p>

      <dl className="pi-confirm__grid">
        <div>
          <dt>{isRequest ? "Request reference" : "Booking reference"}</dt>
          <dd>
            <Placeholder id="bookingReference" />
          </dd>
        </div>
        <div>
          <dt>Trip</dt>
          <dd>{details.tripTitle}</dd>
        </div>
        {details.selections && details.selections.length > 0 ? (
          <div>
            <dt>Your choices</dt>
            <dd>{details.selections.join(" · ")}</dd>
          </div>
        ) : null}
        {typeof details.seat === "number" ? (
          <div>
            <dt>Seat</dt>
            <dd>Seat {details.seat}</dd>
          </div>
        ) : null}
        <div>
          <dt>Guest</dt>
          <dd>{details.guestName || "—"}</dd>
        </div>
        <div>
          <dt>Guests</dt>
          <dd>{details.guestCount ?? 1}</dd>
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
            {details.totalEgp !== undefined
              ? `${details.totalEgp.toLocaleString("en-US")} EGP`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Booking status</dt>
          <dd>
            <Placeholder id="bookingStatus" />
          </dd>
        </div>
        <div>
          <dt>Payment status</dt>
          <dd>
            <Placeholder id="paymentStatus" />
          </dd>
        </div>
      </dl>

      <div className="pi-confirm__next">
        <h3>What happens next</h3>
        <ol>
          <li>We check every service on the trip against our suppliers.</li>
          <li>We come back to you with what is available and what it costs.</li>
          <li>A deposit starts the booking; the balance is settled before the trip.</li>
          <li>
            Once everything is confirmed you receive a written Booking
            Confirmation with every detail on it.
          </li>
        </ol>
      </div>

      <p className="pi-confirm__preview">
        Preview only — nothing was sent, saved or charged. There is no backend
        and no payment step yet.
      </p>
    </div>
  );
}
