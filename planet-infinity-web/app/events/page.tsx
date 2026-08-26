import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { Eyebrow } from "@/components/Eyebrow";
import { Grid } from "@/components/Grid";
import { Section } from "@/components/Section";
import { CTA } from "@/content/cta";
import { getListedEvents } from "@/content/source";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Beach sessions, movie nights and full-moon parties from Planet Infinity Entertainment.",
};

export default async function EventsPage() {
  const [{ events, usingDemoData }, copy] = await Promise.all([getListedEvents(), getSiteCopy()]);

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

          {events.length > 0 ? (
            <Grid columns={3}>
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
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
    </div>
  );
}
