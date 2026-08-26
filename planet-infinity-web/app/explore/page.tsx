import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/Button";
import { ComingSoonCard } from "@/components/ComingSoonCard";
import { Container } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { Grid } from "@/components/Grid";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { CTA } from "@/content/cta";
import { getListedEvents, getListedTrips } from "@/content/source";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Everything Planet Infinity runs, in one place — travel, events, and what is coming next.",
};

/**
 * Discovery surface.
 *
 * A visitor who does not already know whether they want a trip or a night out
 * starts here. It counts what actually exists rather than describing a
 * catalogue that does not — and it never shows demo configurations as
 * inventory.
 */
export default async function ExplorePage() {
  const [{ trips, usingDemoData: tripsAreDemo }, { events, usingDemoData: eventsAreDemo }] = await Promise.all([getListedTrips(), getListedEvents()]);

  // Demo configurations are architecture test cases, never public inventory.
  const tripCount = tripsAreDemo ? 0 : trips.length;
  const eventCount = eventsAreDemo ? 0 : events.length;

  return (
    <>
      <Section tone="ivory" className="pi-listing-hero">
        <Container>
          <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Explore" }]} />
          <Eyebrow>Explore</Eyebrow>
          <h1 className="pi-listing-hero__title">Everything we run</h1>
          <p className="pi-listing-hero__lede">
            Two worlds are open today and more of the universe is on the way.
            Start wherever you like.
          </p>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <SectionHeading eyebrow="Open now" title="Where to start" />
          <Grid columns={2}>
            <article className="pi-explore-card">
              <p className="pi-explore-card__count">
                {tripCount > 0 ? tripCount : "—"}
              </p>
              <h2 className="pi-explore-card__title">Travel</h2>
              <p className="pi-explore-card__body">
                Trips and experiences. Some are booked with a single request,
                some let you choose a package or a date, and a rare few let you
                pick your seat.
              </p>
              <p className="pi-explore-card__note">
                {tripCount > 0
                  ? `${tripCount} available`
                  : "No trips listed yet — nothing goes up before it is real."}
              </p>
              <ButtonLink href="/trips">{CTA.exploreTravel}</ButtonLink>
            </article>

            <article className="pi-explore-card pi-world-events">
              <p className="pi-explore-card__count">
                {eventCount > 0 ? eventCount : "—"}
              </p>
              <h2 className="pi-explore-card__title">Events</h2>
              <p className="pi-explore-card__body">
                Beach sessions, movie nights and full-moon parties. Some are
                open ticketing, some offer ticket tiers, and some are curated
                by request.
              </p>
              <p className="pi-explore-card__note">
                {eventCount > 0
                  ? `${eventCount} announced`
                  : "No events announced yet — dates are confirmed before they are listed."}
              </p>
              <ButtonLink href="/events">{CTA.exploreEvents}</ButtonLink>
            </article>
          </Grid>
        </Container>
      </Section>

      <Section tone="ivory">
        <Container>
          <SectionHeading
            eyebrow="Coming soon"
            title="Not open yet"
            lede="Kept visible on purpose — these are part of the plan, not placeholders."
          />
          <Grid columns={2}>
            <ComingSoonCard
              eyebrow="Themes"
              title="Curated concepts"
              body="Seasonal capsules and ideas Planet Infinity invents rather than sells."
            />
            <ComingSoonCard
              eyebrow="Merch"
              title="Planet Infinity merch"
              body="Something to wear home from the trip. No catalogue and no pre-orders yet."
            />
          </Grid>
        </Container>
      </Section>
    </>
  );
}
