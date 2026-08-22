import type { PlanetEvent } from "@/content/events";
import { AvailabilityPill } from "./AvailabilityPill";
import { Card } from "./Card";
import { DemoBadge } from "./DemoBadge";
import { MediaBlock } from "./MediaBlock";
import { Placeholder } from "./Placeholder";
import { Price } from "./Price";

/**
 * Same card anatomy as TripCard so a visitor moving between travel and events
 * never feels they changed websites — but its own component, reading the
 * event model.
 *
 * The card ALWAYS routes to the event detail page and never to a booking
 * flow. It cannot know which ticketing model an event uses, so it never shows
 * a ticket control and never implies one.
 */
export function EventCard({ event }: { event: PlanetEvent }) {
  return (
    <Card href={`/events/${event.slug}`} className="pi-eventcard pi-world-events">
      <MediaBlock
        src={event.media.hero}
        alt={event.media.heroAlt ?? ""}
        ratio="3-2"
      />
      <div className="pi-card__body">
        <p className="pi-card__meta">
          <span className="pi-event-category">{event.category}</span>
          <span aria-hidden="true"> · </span>
          {event.eventDate ?? <Placeholder id="eventDate" label="Date not set" />}
        </p>

        <h3 className="pi-card__title">{event.title}</h3>
        <p className="pi-card__summary">{event.shortDescription}</p>

        <p className="pi-card__meta">
          {event.venue ?? <Placeholder id="eventVenue" label="Venue not set" />}
        </p>

        {event.isDemo ? (
          <p className="pi-card__flags">
            <DemoBadge />
          </p>
        ) : null}

        <div className="pi-card__foot">
          <Price
            egp={event.priceEgp}
            unit={event.priceUnit ?? "per ticket"}
            placeholderId="ticketPrice"
          />
          <AvailabilityPill state={event.availability} />
        </div>
      </div>
    </Card>
  );
}
