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
  title: { absolute: "Planet Infinity | Entertainment, Community & Experiences" },
  description: "Discover Planet Infinity: curated gatherings, events, experiences and selected trips — with clear details, galleries and secure booking when available.",
  alternates: { canonical: "/" },
};

// The home page is a teaser, not the catalogue: it must never show the exact
// same list a visitor would then find on /trips or /events, or the "view
// all" link reads as a dead click into an identical page.
const HOME_PREVIEW_COUNT = 3;

/** A single small, video-forward glance card in the hero spotlight strip. */
type SpotlightItem = { key: string; href: string; title: string; image?: string; video?: string; alt?: string };

export default async function HomePage() {
  const [trips, events, copy] = await Promise.all([getTrips(), getEvents(), getSiteCopy()]);
  const previewTrips = trips.slice(0, HOME_PREVIEW_COUNT);
  const previewEvents = events.slice(0, HOME_PREVIEW_COUNT);

  // The hero used to spotlight one single trip in one giant video — this
  // spotlight strip is several small cards instead (each trip's and event's
  // own video playing on its own card), so the first screen gives an honest
  // glance at what's actually on offer rather than one oversized pick.
  const spotlightItems: SpotlightItem[] = [
    ...previewTrips.map((trip): SpotlightItem => ({
      key: `trip-${trip.id}`,
      href: `/trips/${trip.slug}`,
      title: trip.title,
      image: trip.media.hero,
      video: trip.media.video,
      alt: trip.media.heroAlt,
    })),
    ...previewEvents.map((event): SpotlightItem => ({
      key: `event-${event.id}`,
      href: `/events/${event.slug}`,
      title: event.title,
      image: event.media.hero,
      video: event.media.video,
      alt: event.media.heroAlt,
    })),
  ];

  return (
    <>
      <section className="pi-home-hero">
        <Container className="pi-home-hero__grid">
          <div className="pi-home-hero__copy">
            <p className="pi-home-hero__eyebrow">{copy.home_eyebrow}</p>
            <h1>{copy.home_title}</h1>
            <p className="pi-home-hero__lede">{copy.home_lede}</p>
            <div className="pi-home-hero__actions">
              <ButtonLink href="#trips" size="large">{copy.home_trips_cta}</ButtonLink>
              <ButtonLink href="#events" variant="secondary" size="large">{copy.home_events_cta}</ButtonLink>
            </div>
          </div>

          <div className="pi-home-hero__visual">
            <div className="pi-home-hero__orbit" aria-hidden="true">∞</div>
            {spotlightItems.length > 0 ? (
              <div className="pi-home-hero__spotlight-grid">
                {spotlightItems.map((item) => (
                  <Link key={item.key} href={item.href} className="pi-home-hero__spotlight-card">
                    <MediaBlock
                      src={item.image}
                      videoSrc={item.video}
                      alt={item.alt || item.title}
                      ratio="3-2"
                      radius="card"
                    />
                    <span className="pi-home-hero__spotlight-card__title">{item.title}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <MediaBlock ratio="4-5" radius="hero" emptyLabel="New worlds loading" />
            )}
            <div className="pi-home-hero__spotlight-actions">
              <ButtonLink href="/trips" variant="secondary">{copy.home_trips_all}</ButtonLink>
              <ButtonLink href="/events" variant="secondary">{copy.home_events_all}</ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <Section tone="white" id="trips" className="pi-home-catalog pi-home-catalog--travel">
        <Container>
          <SectionHeading
            eyebrow="Travel"
            title={copy.home_trips_title}
            lede={copy.home_trips_lede}
            action={
              trips.length > previewTrips.length ? (
                <ButtonLink href="/trips" variant="secondary">{copy.home_trips_all}</ButtonLink>
              ) : undefined
            }
          />
          {previewTrips.length > 0 ? (
            <Grid columns={3}>{previewTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}</Grid>
          ) : (
            <EmptyState title={copy.home_trips_empty_title} body={copy.home_trips_empty_body} />
          )}
        </Container>
      </Section>

      <Section tone="ivory" id="events" className="pi-home-catalog pi-home-catalog--events pi-world-events">
        <Container>
          <SectionHeading
            eyebrow="Events"
            title={copy.home_events_title}
            lede={copy.home_events_lede}
            action={
              events.length > previewEvents.length ? (
                <ButtonLink href="/events" variant="secondary">{copy.home_events_all}</ButtonLink>
              ) : undefined
            }
          />
          {previewEvents.length > 0 ? (
            <Grid columns={3}>{previewEvents.map((event) => <EventCard key={event.id} event={event} />)}</Grid>
          ) : (
            <EmptyState title={copy.home_events_empty_title} body={copy.home_events_empty_body} />
          )}
        </Container>
      </Section>
    </>
  );
}
