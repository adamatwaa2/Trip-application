import { bookingSteps, STEP_LABELS, type Trip } from "@/content/trips";
import { CTA } from "@/content/cta";
import { AvailabilityPill } from "./AvailabilityPill";
import { ButtonLink } from "./Button";
import { Placeholder } from "./Placeholder";
import { Price } from "./Price";

/**
 * The booking module on a trip page.
 *
 * It inspects the trip's own configuration and shows only the steps that
 * apply. It never renders a seat map itself and never implies one exists:
 * seats appear in the flow only when the trip sets seatBookingEnabled.
 *
 * CTA wording follows bookingMode, from the locked lexicon:
 *   booking      → Book now
 *   request      → legacy manual request
 *   application  → sends the guest to the application flow instead
 */
export function TripBookingModule({ trip }: { trip: Trip }) {
  const steps = bookingSteps(trip);

  if (trip.applicationRequired || trip.bookingMode === "application") {
    return (
      <aside className="pi-booking">
        <div className="pi-booking__head">
          <Price egp={trip.priceEgp} unit={trip.priceUnit} size="large" />
          <AvailabilityPill state={trip.availability} />
        </div>
        <p className="pi-booking__note">
          This trip is by application. We review who is coming before any seat
          is held.
        </p>
        <ButtonLink
          href={`/apply?product=${encodeURIComponent(trip.id)}&type=trip&title=${encodeURIComponent(trip.title)}`}
          size="large"
          className="pi-booking__cta"
        >
          Apply to join
        </ButtonLink>
      </aside>
    );
  }

  const label = trip.ctaLabelOverride ?? CTA.bookNow;

  return (
    <aside className="pi-booking">
      <div className="pi-booking__head">
        <Price egp={trip.priceEgp} unit={trip.priceUnit} size="large" />
        <AvailabilityPill state={trip.availability} />
      </div>

      <div className="pi-booking__overview">
        <span>Overview</span>
        <p>{trip.shortDescription}</p>
      </div>

      <p className="pi-booking__meta">
        {trip.duration ?? <Placeholder id="tripDuration" label="Duration not set" />}
      </p>

      {/* What this particular trip's flow actually involves. */}
      <ol className="pi-booking__steps">
        {steps.map((step, index) => (
          <li key={step}>
            <span className="pi-booking__step-num">{index + 1}</span>
            {STEP_LABELS[step]}
          </li>
        ))}
      </ol>

      <ButtonLink
        href={`/trips/${trip.slug}/book`}
        size="large"
        className="pi-booking__cta"
      >
        {label}
      </ButtonLink>

      <p className="pi-booking__note">
        {trip.ctaHelper ?? "Payment instructions and the private receipt upload appear in the booking form."}
      </p>
    </aside>
  );
}
