import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { Grid } from "@/components/Grid";
import { MediaBlock } from "@/components/MediaBlock";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { TripCard } from "@/components/TripCard";
import { getEvents, getTrips } from "@/content/source";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: "Trips, experiences and events",
  description: "Book Planet Infinity trips, experiences and events.",
};

export default async function HomePage() {
  const [trips, events, copy] = await Promise.all([getTrips(), getEvents(), getSiteCopy()]);
  const featured = trips.find((trip) => trip.featured) ?? trips[0];

  return (
    <>
      <section className="pi-home-hero">
        <Container className="pi-home-hero__grid">
          <div className="pi-home-hero__copy">
            <p className="pi-home-hero__eyebrow">{copy.home_eyebrow}</p>
            <h1>{copy.home_title}</h1>
            <p className="pi-home-hero__lede">{copy.home_lede}</p>
            <div className="pi-home-hero__actions">
              <ButtonLink href="#trips" size="large">See open trips</ButtonLink>
              <ButtonLink href="#events" variant="secondary" size="large">See events</ButtonLink>
            </div>
          </div>

          <div className="pi-home-hero__visual">
            <div className="pi-home-hero__orbit" aria-hidden="true">∞</div>
            {featured ? (
              <Link className="pi-home-feature" href={`/trips/${featured.slug}`}>
                <MediaBlock
                  src={featured.media.hero}
                  videoSrc={featured.media.video}
                  alt={featured.media.heroAlt ?? ""}
                  ratio="4-5"
                  radius="hero"
                >
                  <p className="pi-home-feature__meta">Featured trip</p>
                  <h2>{featured.title}</h2>
                  <span>Open trip details →</span>
                </MediaBlock>
              </Link>
            ) : (
              <MediaBlock ratio="4-5" radius="hero" emptyLabel="New worlds loading" />
            )}
          </div>
        </Container>
      </section>

      <Section tone="white" id="trips" className="pi-home-catalog pi-home-catalog--travel">
        <Container>
          <SectionHeading
            eyebrow="Travel"
            title={copy.home_trips_title}
            lede={copy.home_trips_lede}
            action={<ButtonLink href="/trips" variant="secondary">View all trips</ButtonLink>}
          />
          {trips.length > 0 ? (
            <Grid columns={3}>{trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}</Grid>
          ) : (
            <EmptyState title="No trips are open right now" body="New departures will appear here as soon as they are published." />
          )}
        </Container>
      </Section>

      <Section tone="ivory" id="events" className="pi-home-catalog pi-home-catalog--events pi-world-events">
        <Container>
          <SectionHeading
            eyebrow="Events"
            title={copy.home_events_title}
            lede={copy.home_events_lede}
            action={<ButtonLink href="/events" variant="secondary">Enter the events world</ButtonLink>}
          />
          {events.length > 0 ? (
            <Grid columns={3}>{events.map((event) => <EventCard key={event.id} event={event} />)}</Grid>
          ) : (
            <EmptyState title="The next event is taking shape" body="Day or night, it will appear here as soon as the date and ticket details are certain." />
          )}
        </Container>
      </Section>
    </>
  );
}
