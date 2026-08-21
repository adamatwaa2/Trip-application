import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { Grid } from "@/components/Grid";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { CTA } from "@/content/cta";
import { EVENTS } from "@/content/events";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Beach sessions, movie nights and full-moon parties from Planet Infinity Entertainment.",
};

/**
 * Events listing.
 *
 * Minimal by design, same as /trips: it exists so navigation leads somewhere
 * real. Event detail pages at /events/[slug] and ticketing are designed
 * separately.
 */
export default function EventsPage() {
  return (
    <Section tone="ivory">
      <Container>
        <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Events" }]} />
        <SectionHeading
          eyebrow="Events"
          title="The nights we throw"
          lede="Beach sessions, movie nights, full-moon parties. The other half of what we do."
          level="h1"
          as="h1"
        />

        {EVENTS.length > 0 ? (
          <Grid columns={3}>
            {EVENTS.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </Grid>
        ) : (
          <EmptyState
            title="The next dates are being locked in"
            body="Line-ups, venues and ticket details are confirmed before an event is listed. Nothing is announced here before it is certain."
            action={
              <ButtonLink href="/trips" variant="secondary">
                {CTA.exploreTravel}
              </ButtonLink>
            }
          />
        )}
      </Container>
    </Section>
  );
}
