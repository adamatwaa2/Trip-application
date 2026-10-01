import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { ExploreUniverse } from "@/components/ExploreUniverse";
import { getCrossListedTrips, getListedEvents, getListedTrips } from "@/content/source";
import { planetInfinityBuilds } from "@/content/explore-builds";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: "Explore",
  description: "Move through the travel and events worlds of Planet Infinity.",
  alternates: { canonical: "/explore" },
};

export default async function ExplorePage() {
  const [{ trips, usingDemoData: tripsAreDemo }, { events, usingDemoData: eventsAreDemo }, eventTrips, copy] = await Promise.all([
    getListedTrips(),
    getListedEvents(),
    getCrossListedTrips("events"),
    getSiteCopy(),
  ]);
  const tripCount = tripsAreDemo ? 0 : trips.length;
  const eventCount = eventsAreDemo ? 0 : events.length;
  const exploreTrips = tripsAreDemo ? [] : trips.map((trip) => ({
    slug: trip.slug,
    title: trip.title,
    kicker: trip.destination,
    href: `/trips/${trip.slug}`,
    background: trip.media.hero,
    theme: trip.media.visualTheme,
  }));
  const exploreEvents = eventsAreDemo ? [] : events.map((event) => ({
    slug: event.slug,
    title: event.title,
    kicker: event.category,
    href: event.media.linkedTripSlug ? `/trips/${event.media.linkedTripSlug}` : `/events/${event.slug}`,
    background: event.media.hero,
    theme: event.media.visualTheme,
  })).concat(eventTrips.map((trip) => ({
    slug: trip.slug,
    title: trip.title,
    kicker: "Theme trip",
    href: `/trips/${trip.slug}`,
    background: trip.media.hero,
    theme: trip.media.visualTheme,
  })));

  return (
    <div className="pi-explore-universe">
      <Container>
        <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Explore" }]} />
        <div className="pi-explore-universe__intro">
          <p className="pi-home-hero__eyebrow">Explore</p>
          <h1>{copy.explore_title}</h1>
          <p>{copy.explore_lede}</p>
        </div>
        <section className="pi-explore-builds" aria-labelledby="explore-builds-title">
          <header>
            <p>THE BIGGER PICTURE</p>
            <h2 id="explore-builds-title">What we’re building.</h2>
            <span>Planet Infinity is growing beyond individual trips and events.</span>
          </header>
          <div className="pi-explore-builds__grid">
            {planetInfinityBuilds.map((item) => (
              <article key={item.id}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
        <ExploreUniverse
          trips={exploreTrips}
          events={exploreEvents}
          tripCount={tripCount}
          eventCount={eventCount}
        />
      </Container>
    </div>
  );
}
