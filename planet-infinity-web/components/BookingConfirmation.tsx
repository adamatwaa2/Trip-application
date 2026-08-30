import { Placeholder } from "./Placeholder";

export type ConfirmationDetails = {
  tripTitle: string;
  /** Chosen option labels, in group order. Empty when selection is off. */
  selections?: string[];
  /** Only present when the trip enables seat booking. */
  seats?: number[];
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCount?: number;
  totalEgp?: number;
  requestNumber?: string;
  /** Direct bookings receive a booking reference; exceptional flows receive an application reference. */
  mode: "booking" | "request" | "application";
};

/**
 * Reusable confirmation state.
 *
 * Direct bookings are saved immediately. Payment remains pending until the
 * uploaded receipt is checked by an admin.
 */
export function BookingConfirmation({ details }: { details: ConfirmationDetails }) {
  const isRequest = details.mode !== "booking";

  return (
    <div className="pi-confirm">
      <div className="pi-confirm__mark" aria-hidden="true">
        ✓
      </div>
      <h2 className="pi-confirm__title">
        {isRequest ? "Request received" : "Booking sent successfully"}
      </h2>
      <p className="pi-confirm__lede">
        {isRequest
          ? "Nothing is confirmed yet. We check availability with our suppliers and come back to you — a request is not a booking until we issue a written confirmation."
          : "Your booking and payment receipt reached the Planet Infinity team. We are now verifying the payment and the final trip services."}
      </p>

      <dl className="pi-confirm__grid">
        <div>
          <dt>{isRequest ? "Application reference" : "Booking reference"}</dt>
          <dd>{details.requestNumber ?? <Placeholder id="bookingReference" />}</dd>
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
        {details.seats?.length ? (
          <div>
            <dt>{details.seats.length === 1 ? "Seat" : "Seats"}</dt>
            <dd>{details.seats.map((seat) => `Seat ${seat}`).join(" · ")}</dd>
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
            {details.totalEgp !== undefined ? (
              `${details.totalEgp.toLocaleString("en-US")} EGP`
            ) : (
              <Placeholder id="pricePerSeat" label="Price not set" />
            )}
          </dd>
        </div>
      </dl>

      <div className="pi-confirm__next">
        <h3>What happens next</h3>
        {isRequest ? (
          <ol>
            <li>We review your application.</li>
            <li>We contact you with the decision and the next booking step.</li>
          </ol>
        ) : (
          <ol>
            <li><strong>✓ Booking submitted.</strong></li>
            <li>We verify the uploaded payment receipt.</li>
            <li>We send your final Booking Confirmation and PDF.</li>
          </ol>
        )}
      </div>

      <p className="pi-confirm__preview">
        {isRequest
          ? "Your application has been saved for review."
          : "You can close this page. Your final Booking Confirmation will be sent as soon as payment and services are verified."}
      </p>
    </div>
  );
}
