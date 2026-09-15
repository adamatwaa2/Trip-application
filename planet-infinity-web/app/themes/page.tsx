import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { Eyebrow } from "@/components/Eyebrow";
import { ThemeWorldCard } from "@/components/ThemeWorldCard";
import { getCrossListedTrips, getThemedEvents } from "@/content/source";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: "Themes",
  description: "Immersive Planet Infinity worlds for trips, events and custom experiences.",
  alternates: { canonical: "/themes" },
};

export default async function ThemesPage() {
  const [trips, events, copy] = await Promise.all([
    getCrossListedTrips("themes"),
    getThemedEvents(),
    getSiteCopy(),
  ]);
  const worlds = [
    ...trips.map((trip) => ({
      id: `trip-${trip.id}`,
      href: `/trips/${trip.slug}`,
      title: trip.title,
      description: trip.shortDescription,
      context: trip.destination,
      hero: trip.media.hero,
      logo: trip.media.visualTheme?.logo,
      channels: (trip.media.visualTheme?.channels ?? ["trips"]).map((channel) => channel === "trips" ? "Trip" : channel === "events" ? "Event" : "Theme"),
    })),
    ...events.filter((event) => !event.media.linkedTripSlug).map((event) => ({
      id: `event-${event.id}`,
      href: `/events/${event.slug}`,
      title: event.title,
      description: event.shortDescription,
      context: event.venue ?? event.category,
      hero: event.media.hero,
      logo: event.media.visualTheme?.logo,
      channels: (event.media.visualTheme?.channels ?? ["events"]).map((channel) => channel === "trips" ? "Trip" : channel === "events" ? "Event" : "Theme"),
    })),
  ];

  return (
    <main className="pi-world-themes">
      <section className="pi-themes-hero">
        <Container>
          <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Themes" }]} />
          <div className="pi-themes-hero__grid">
            <div>
              <Eyebrow>{copy.themes_eyebrow}</Eyebrow>
              <h1>{copy.themes_title}</h1>
              <p>{copy.themes_lede}</p>
            </div>
            <div className="pi-themes-hero__manifesto" aria-label="What a Planet Infinity theme is">
              <span>Not a destination.</span>
              <strong>A complete world.</strong>
              <p>One identity carried through the setting, music, visuals and every guest touchpoint.</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="pi-themes-current">
        <Container>
          <header className="pi-themes-section-head">
            <div><Eyebrow>Current themes</Eyebrow><h2>Worlds you can enter now</h2></div>
            <p>{worlds.length} {worlds.length === 1 ? "world" : "worlds"} currently available</p>
          </header>
          {worlds.length ? (
            <div className="pi-theme-world-list">
              {worlds.map((world, index) => <ThemeWorldCard key={world.id} {...world} index={index} />)}
            </div>
          ) : <EmptyState title={copy.themes_empty_title} body={copy.themes_empty_body} />}
        </Container>
      </section>

      <section className="pi-themes-upcoming">
        <Container className="pi-themes-upcoming__grid">
          <div><Eyebrow>Upcoming themes</Eyebrow><h2>The next worlds are being built.</h2></div>
          <div><p>Future identities will appear here when they are ready—not as ordinary trip cards, but as worlds that can become a trip, an event, or a custom experience.</p><ButtonLink href="/contact" variant="secondary">Build a custom experience</ButtonLink></div>
        </Container>
      </section>
    </main>
  );
}
