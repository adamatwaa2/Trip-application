import type { PlanetEvent } from "@/content/events";
import { AvailabilityPill } from "./AvailabilityPill";
import { Card } from "./Card";
import { MediaBlock } from "./MediaBlock";
import { Price } from "./Price";

/**
 * Same anatomy as TripCard — a visitor moving between trips and events should
 * never feel they changed websites.
 *
 * Event Violet belongs to the Events world and is used for atmosphere only,
 * never for a button, a price or an availability badge.
 */
export function EventCard({ event }: { event: PlanetEvent }) {
  const meta = [event.kind, event.dateLabel, event.venue]
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Card href={`/events/${event.slug}`} className="pi-eventcard">
      <MediaBlock src={event.image} alt={event.imageAlt ?? ""} ratio="3-2" />
      <div className="pi-card__body">
        <p className="pi-card__meta">
          {meta.map((item, index) => (
            <span key={item}>
              {index > 0 ? <span aria-hidden="true"> · </span> : null}
              {item}
            </span>
          ))}
        </p>
        <h3 className="pi-card__title">{event.title}</h3>
        <p className="pi-card__summary">{event.summary}</p>
        <div className="pi-card__foot">
          <Price egp={event.priceEgp} unit="per ticket" />
          <AvailabilityPill state={event.availability} />
        </div>
      </div>
    </Card>
  );
}
