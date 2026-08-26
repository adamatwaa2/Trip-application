import type { Metadata } from "next";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { Grid } from "@/components/Grid";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { TripCard } from "@/components/TripCard";
import { getEvents, getTrips } from "@/content/source";

export const metadata: Metadata = {
  title: "Trips and events",
  description: "Book Planet Infinity trips and events.",
};

export default async function HomePage() {
  const [trips, events] = await Promise.all([getTrips(), getEvents()]);

  return (
    <>
      <Section tone="ivory">
        <Container>
          <SectionHeading
            eyebrow="Planet Infinity"
            title="Trips & events"
            lede="Choose what you want to join. Every published trip and event is listed here."
          />
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <SectionHeading
            eyebrow="Travel"
            title="All trips"
            lede="Open a trip to see its details, dates and booking options."
            action={<ButtonLink href="/trips" variant="secondary">Open trips page</ButtonLink>}
          />
          {trips.length > 0 ? (
            <Grid columns={3}>
              {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
            </Grid>
          ) : (
            <EmptyState title="No trips are open right now" body="New departures will appear here as soon as they are published." />
          )}
        </Container>
      </Section>

      <Section tone="ivory">
        <Container>
          <SectionHeading
            eyebrow="Events"
            title="All events"
            lede="Open an event to see the venue, date and ticket details."
            action={<ButtonLink href="/events" variant="secondary">Open events page</ButtonLink>}
          />
          {events.length > 0 ? (
            <Grid columns={3}>
              {events.map((event) => <EventCard key={event.id} event={event} />)}
            </Grid>
          ) : (
            <EmptyState title="No events are open right now" body="New event dates will appear here as soon as they are published." />
          )}
        </Container>
      </Section>
    </>
  );
}
