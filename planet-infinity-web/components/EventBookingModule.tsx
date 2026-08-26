import {
  eventBookingSteps,
  EVENT_STEP_LABELS,
  type PlanetEvent,
} from "@/content/events";
import { AvailabilityPill } from "./AvailabilityPill";
import { ButtonLink } from "./Button";
import { Placeholder } from "./Placeholder";
import { Price } from "./Price";

/**
 * The booking module on an event page.
 *
 * It reads the event's own configuration and lists only the steps that apply.
 * It never renders a ticket picker, a quantity control or — under any
 * circumstances — a seat map: events have no seat model.
 *
 * CTA wording follows bookingMode, from the locked lexicon:
 *   booking      → Get tickets
 *   request      → Request to book
 *   application  → Request access
 */
export function EventBookingModule({ event }: { event: PlanetEvent }) {
  const steps = eventBookingSteps(event);

  if (event.applicationRequired || event.bookingMode === "application") {
    return (
      <aside className="pi-booking">
        <div className="pi-booking__head">
          <Price
            egp={event.priceEgp}
            unit={event.priceUnit}
            size="large"
            placeholderId="ticketPrice"
          />
          <AvailabilityPill state={event.availability} />
        </div>
        <p className="pi-booking__note">
          This event requires an application. We review each request before booking.
        </p>
        <ButtonLink
          href={`/apply?product=${encodeURIComponent(event.id)}&type=event&title=${encodeURIComponent(event.title)}`}
          size="large"
          className="pi-booking__cta"
        >
          Request access
        </ButtonLink>
      </aside>
    );
  }

  const label =
    event.ctaLabelOverride ??
    (event.bookingMode === "booking"
      ? "Get tickets"
      : "Request to book");

  return (
    <aside className="pi-booking">
      <div className="pi-booking__head">
        <Price
          egp={event.priceEgp}
          unit={event.priceUnit}
          size="large"
          placeholderId="ticketPrice"
        />
        <AvailabilityPill state={event.availability} />
      </div>

      <p className="pi-booking__meta">
        {event.eventDate ?? <Placeholder id="eventDate" label="Date not set" />}
        {" · "}
        {event.startTime ?? <Placeholder id="eventTime" label="Time not set" />}
      </p>

      <ol className="pi-booking__steps">
        {steps.map((step, index) => (
          <li key={step}>
            <span className="pi-booking__step-num">{index + 1}</span>
            {EVENT_STEP_LABELS[step]}
          </li>
        ))}
      </ol>

      <ButtonLink
        href={`/events/${event.slug}/book`}
        size="large"
        className="pi-booking__cta"
      >
        {label}
      </ButtonLink>

      <p className="pi-booking__note">
        {event.ctaHelper ??
          "Nothing is charged in this preview — there is no payment step yet."}
      </p>
    </aside>
  );
}
