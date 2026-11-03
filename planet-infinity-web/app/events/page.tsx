import Link from "next/link";
import { splitEvents } from "@/lib/event-archive";
import { UpcomingCatalogGrid } from "@/components/UpcomingCatalogGrid";

import { getPageSeoMetadata } from "@/lib/site-presentation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { TripCard } from "@/components/TripCard";
import { Eyebrow } from "@/components/Eyebrow";
import { Grid } from "@/components/Grid";
import { Section } from "@/components/Section";
import { CTA } from "@/content/cta";
import { getCrossListedTrips, getListedEvents } from "@/content/source";
import { getSiteCopy } from "@/lib/site-copy";

export function generateMetadata() { return getPageSeoMetadata("/events", "Events", "Beach sessions, movie nights and full-moon parties from Planet Infinity Entertainment."); }

export default async function EventsPage() {
  const [{ events, usingDemoData }, sharedTrips, copy] = await Promise.all([getListedEvents(), getCrossListedTrips("events"), getSiteCopy()]);
  const { upcoming, past } = splitEvents(events);
  const hasItems = upcoming.length + sharedTrips.length > 0;

  return (
    <div className="pi-world-events">
      <Section tone="ivory" className="pi-listing-hero">
        <Container>
          <Breadcrumbs
            trail={[{ label: "Home", href: "/" }, { label: "Events" }]}
          />
          <Eyebrow>Events</Eyebrow>
          <h1 className="pi-listing-hero__title">{copy.events_title}</h1>
          <p className="pi-listing-hero__lede">{copy.events_lede}</p>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          {usingDemoData ? (
            <div className="pi-demo-banner" role="note">
              <strong>These are architecture test cases, not real events.</strong>{" "}
              The four demo configurations below exist to prove that ticket
              selection, quantity and the request path work independently. Real
              events replace them entirely — nothing here is a Planet Infinity
              night, and no name, date, venue, price or ticket on them is real.
            </div>
          ) : null}

          {hasItems ? (
            <Grid columns={3}>
              {sharedTrips.map((trip) => (
                <TripCard key={`trip-${trip.id}`} trip={trip} />
              ))}
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </Grid>
          ) : (
            <EmptyState
              title={copy.events_empty_title}
              body={copy.events_empty_body}
              action={
                <ButtonLink href="/trips" variant="secondary">
                  {CTA.exploreTravel}
                </ButtonLink>
              }
            />
          )}
        </Container>
      </Section>
      <UpcomingCatalogGrid channel="events" title="Upcoming Events" publishedSlugs={[...events,...sharedTrips].map(item=>item.slug)} />
      <Section tone="ivory" id="past-events">
        <Container>
          <details>
            <summary><strong>Past Events ({past.length})</strong></summary>
            {past.length ? (
              <ul>
                {past.map(event => (
                  <li key={event.id}>
                    <Link href={"/events/" + event.slug}>{event.title}</Link>
                    {event.eventDate ? <span> · {event.eventDate}</span> : null}
                  </li>
                ))}
              </ul>
            ) : <p>No past events to show yet.</p>}
          </details>
        </Container>
      </Section>
    </div>
  );
}

