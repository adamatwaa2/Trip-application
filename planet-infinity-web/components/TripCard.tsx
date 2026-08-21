import type { Trip } from "@/content/trips";
import { AvailabilityPill } from "./AvailabilityPill";
import { Card } from "./Card";
import { MediaBlock } from "./MediaBlock";
import { Price } from "./Price";

/**
 * Card anatomy (PI-WB-002, Plate 06): image first, mono meta row of at most
 * three items, Jakarta 700 title at two lines maximum, price left and
 * availability right, whole card is the link.
 *
 * This card makes NO assumption about how the trip is booked. It never
 * mentions seats, and it never renders a booking control — choosing a package,
 * a date, or a seat belongs to the trip's own page.
 */
export function TripCard({ trip }: { trip: Trip }) {
  const meta = [trip.destination, trip.durationLabel].filter(Boolean);

  return (
    <Card href={`/trips/${trip.slug}`} className="pi-tripcard">
      <MediaBlock src={trip.image} alt={trip.imageAlt ?? ""} ratio="3-2" />
      <div className="pi-card__body">
        <p className="pi-card__meta">
          {meta.map((item, index) => (
            <span key={item}>
              {index > 0 ? <span aria-hidden="true"> · </span> : null}
              {item}
            </span>
          ))}
        </p>
        <h3 className="pi-card__title">{trip.title}</h3>
        <p className="pi-card__summary">{trip.summary}</p>
        <div className="pi-card__foot">
          <Price egp={trip.priceEgp} unit="per person" />
          <AvailabilityPill state={trip.availability} />
        </div>
      </div>
    </Card>
  );
}
