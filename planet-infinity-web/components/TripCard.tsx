import type { Trip } from "@/content/trips";
import { AvailabilityPill } from "./AvailabilityPill";
import { Card } from "./Card";
import { DemoBadge } from "./DemoBadge";
import { MediaBlock } from "./MediaBlock";
import { Placeholder } from "./Placeholder";
import { Price } from "./Price";

/**
 * Card anatomy (PI-WB-002, Plate 06): image first, mono meta row of at most
 * three items, title at two lines maximum, price left and availability right,
 * whole card is the link.
 *
 * The card ALWAYS routes to the trip detail page and never to a booking flow.
 * It cannot know which of the four configurations a trip uses, so it never
 * mentions seats, never shows a booking control, and never assumes two trips
 * are booked the same way. The detail page decides.
 */
export function TripCard({ trip }: { trip: Trip }) {
  return (
    <Card href={`/trips/${trip.slug}`} className="pi-tripcard">
      <MediaBlock src={trip.media.hero} alt={trip.media.heroAlt ?? ""} ratio="3-2" />
      <div className="pi-card__body">
        <p className="pi-card__meta">
          {trip.destination}
          <span aria-hidden="true"> · </span>
          {trip.duration ?? <Placeholder id="tripDuration" label="Duration not set" />}
        </p>

        <h3 className="pi-card__title">{trip.title}</h3>
        <p className="pi-card__summary">{trip.shortDescription}</p>

        {trip.isDemo ? (
          <p className="pi-card__flags">
            <DemoBadge />
          </p>
        ) : null}

        <div className="pi-card__foot">
          <Price egp={trip.priceEgp} unit={trip.priceUnit ?? "per person"} />
          <AvailabilityPill state={trip.availability} />
        </div>
      </div>
    </Card>
  );
}
