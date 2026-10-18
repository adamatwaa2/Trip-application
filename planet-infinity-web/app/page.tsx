import type { Metadata } from "next";
import Link from "next/link";
import { HomePlanningLinks } from "@/components/HomePlanningLinks";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { Grid } from "@/components/Grid";
import { HomeExperienceDecks } from "@/components/HomeExperienceDecks";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { TripCard } from "@/components/TripCard";
import { getEvents, getTrips } from "@/content/source";
import { getSiteCopy } from "@/lib/site-copy";
import { getSitePresentation } from "@/lib/site-presentation";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSitePresentation();
  return {
  title: { absolute: settings.seoTitle },
  description: settings.seoDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: settings.seoTitle,
    description: settings.seoDescription,
    images: [settings.shareImage],
    url: "https://planetinfinity.online/",
    siteName: "Planet Infinity",
    locale: "en_EG",
    type: "website",
  },
};
}

export default async function HomePage() {
  const [trips, events, copy] = await Promise.all([getTrips(), getEvents(), getSiteCopy()]);
  return (
    <>
      <section className="pi-home-hero">
        <Container className="pi-home-hero__grid">
          <div className="pi-home-hero__copy">
            <p className="pi-home-hero__eyebrow">{copy.home_eyebrow}</p>
            <h1>{copy.home_title}</h1>
            <p className="pi-home-hero__lede">{copy.home_lede}</p>

          </div>

          <div className="pi-home-hero__visual">
            <div className="pi-home-hero__orbit" aria-hidden="true">∞</div>
            <HomeExperienceDecks trips={trips} events={events} />
          </div>
        </Container>
      </section>

      <Container><HomePlanningLinks /></Container>

      <Section tone="white" id="trips" className="pi-home-catalog pi-home-catalog--travel">
        <Container>
          <SectionHeading eyebrow="Travel" title={copy.home_trips_title} lede={copy.home_trips_lede} action={<ButtonLink href="/trips" variant="secondary">{copy.home_trips_all}</ButtonLink>} />
          <p className="pi-home-planning-link"><Link href="/requests?category=senior">Senior Trip — plan it for your class →</Link></p>
          {trips.length > 0 ? <Grid columns={3}>{trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}</Grid> : <EmptyState title={copy.home_trips_empty_title} body={copy.home_trips_empty_body} />}
        </Container>
      </Section>

      <Section tone="ivory" id="events" className="pi-home-catalog pi-home-catalog--events pi-world-events">
        <Container>
          <SectionHeading eyebrow="Events" title={copy.home_events_title} lede={copy.home_events_lede} action={<ButtonLink href="/events" variant="secondary">{copy.home_events_all}</ButtonLink>} />
          <p className="pi-home-planning-link"><Link href="/requests?category=prom">Prom — Plan Your Prom →</Link></p>
          {events.length > 0 ? <Grid columns={3}>{events.map((event) => <EventCard key={event.id} event={event} />)}</Grid> : <EmptyState title={copy.home_events_empty_title} body={copy.home_events_empty_body} />}
        </Container>
      </Section>
    </>
  );
}
