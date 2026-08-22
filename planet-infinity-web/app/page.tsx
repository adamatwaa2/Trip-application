import type { Metadata } from "next";
import { BrandLogo } from "@/components/BrandLogo";
import { ButtonLink } from "@/components/Button";
import { ComingSoonCard } from "@/components/ComingSoonCard";
import { Container } from "@/components/Container";
import { CtaBlock } from "@/components/CtaBlock";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { Eyebrow } from "@/components/Eyebrow";
import { Grid } from "@/components/Grid";
import { NightField } from "@/components/NightField";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { TripCard } from "@/components/TripCard";
import { CTA } from "@/content/cta";
import { getFeaturedEvents, getFeaturedTrips } from "@/content/source";

export const metadata: Metadata = {
  title: "Travel, experiences and events",
  description:
    "Planet Infinity Entertainment — trips, experiences and events. One brand, more than one world.",
};

/**
 * The Planet Infinity homepage.
 *
 * This is the top-level brand experience, not the travel catalogue. It
 * introduces the universe — the worlds that are open, the ones that are
 * coming — and surfaces whatever real content exists.
 *
 * Featured trips and events come from the data source. They are EMPTY until
 * real Shopify products exist, and the demo configurations never appear here:
 * those exist only to exercise the booking architecture. Empty sections use
 * written empty states rather than invented inventory.
 *
 * Exactly ONE Deep Ink section on this page (the worlds band), plus the
 * footer, with light sections between them so no two dark sections touch.
 */
export default function HomePage() {
  const featuredTrips = getFeaturedTrips();
  const featuredEvents = getFeaturedEvents();

  return (
    <>
      {/* 1 — Hero */}
      <Section tone="ivory" className="pi-hero">
        <Container>
          <div className="pi-hero__mark">
            <BrandLogo world="general" size={96} />
          </div>
          <Eyebrow>Travel · Experiences · Events</Eyebrow>
          <h1 className="pi-hero__title">Escape the ordinary</h1>
          <p className="pi-hero__lede">
            Planet Infinity runs the whole adventure — the roads, the nights
            and everything in between — so you only carry the memories.
          </p>
          <div className="pi-hero__actions">
            <ButtonLink href="/trips" size="large">
              {CTA.exploreTravel}
            </ButtonLink>
            <ButtonLink href="/events" variant="secondary" size="large">
              {CTA.exploreEvents}
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* 2 — The worlds. This page's single Deep Ink section. */}
      <NightField>
        <Container>
          <SectionHeading
            eyebrow="The universe"
            title="More than one world"
            lede="Each world has its own atmosphere and its own way of being booked. None of them is a side project."
          />
          <Grid columns={3}>
            <article className="pi-world">
              <p className="pi-world__number">01</p>
              <h3 className="pi-world__title">Travel</h3>
              <p className="pi-world__body">
                Trips and experiences — desert and sea, camping and
                stargazing, long roads and short escapes.
              </p>
              <ButtonLink href="/trips" variant="tertiary">
                {CTA.exploreTravel}
              </ButtonLink>
            </article>
            <article className="pi-world">
              <p className="pi-world__number">02</p>
              <h3 className="pi-world__title">Events</h3>
              <p className="pi-world__body">
                Beach sessions, movie nights, full-moon parties. After dark,
                run by the same crew and the same standards.
              </p>
              <ButtonLink href="/events" variant="tertiary">
                {CTA.exploreEvents}
              </ButtonLink>
            </article>
            <article className="pi-world pi-world--locked">
              <p className="pi-world__number">
                03 <span className="pi-nav__chip">Soon</span>
              </p>
              <h3 className="pi-world__title">Themes</h3>
              <p className="pi-world__body">
                Curated concepts and seasonal capsules — the ideas Planet
                Infinity invents rather than sells. Not open yet.
              </p>
            </article>
          </Grid>
        </Container>
      </NightField>

      {/* 3 — Featured trips */}
      <Section tone="ivory">
        <Container>
          <SectionHeading
            eyebrow="Travel"
            title="Featured trips"
            lede="A short list of what is worth booking right now."
            action={
              <ButtonLink href="/trips" variant="secondary">
                All trips
              </ButtonLink>
            }
          />
          {featuredTrips.length > 0 ? (
            <Grid columns={3}>
              {featuredTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </Grid>
          ) : (
            <EmptyState
              title="The next departures are being confirmed"
              body="Trips appear here the moment they are real and bookable — never before. Nothing is listed until its dates, price and meeting point are set."
              action={
                <ButtonLink href="/trips" variant="secondary">
                  {CTA.exploreTravel}
                </ButtonLink>
              }
            />
          )}
        </Container>
      </Section>

      {/* 4 — Featured events */}
      <Section tone="white">
        <Container>
          <SectionHeading
            eyebrow="Events"
            title="Featured events"
            lede="The nights worth clearing your calendar for."
            action={
              <ButtonLink href="/events" variant="secondary">
                All events
              </ButtonLink>
            }
          />
          {featuredEvents.length > 0 ? (
            <Grid columns={3}>
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </Grid>
          ) : (
            <EmptyState
              title="The next dates are being locked in"
              body="Line-ups, venues and ticket details are confirmed before an event is announced here."
              action={
                <ButtonLink href="/events" variant="secondary">
                  {CTA.exploreEvents}
                </ButtonLink>
              }
            />
          )}
        </Container>
      </Section>

      {/* 5 — About */}
      <Section tone="ivory">
        <Container size="read">
          <div className="pi-intro">
            <Eyebrow>Who we are</Eyebrow>
            <p className="pi-intro__lead">
              Planet Infinity is a travel company and an events company, run by
              the same people to the same standard.
            </p>
            <p>
              One week it is a road into the desert, a camp under the stars and
              a sunrise nobody photographs properly. The next it is a beach, a
              sound system and a night that runs until the light comes back.
            </p>
            <p>
              We are not a booking form with a logo on it. Every trip and every
              event is planned, staffed and run by us, and the person who
              answers your message is the person who will be there on the day.
            </p>
          </div>
        </Container>
      </Section>

      {/* 6 + 7 — What is coming */}
      <Section tone="white">
        <Container>
          <SectionHeading
            eyebrow="Coming soon"
            title="The rest of the universe"
            lede="Two more parts of Planet Infinity, not open yet."
          />
          <Grid columns={2}>
            <ComingSoonCard
              eyebrow="Merch"
              title="Planet Infinity merch"
              body="Something to wear home from the trip. Not on sale yet — no catalogue, no pre-orders, nothing to sign up to."
            />
            <ComingSoonCard
              eyebrow="Themes"
              title="Curated concepts"
              body="Seasonal capsules and ideas Planet Infinity invents rather than sells. A future world, kept deliberately visible."
            />
          </Grid>
        </Container>
      </Section>

      {/* 8 — Closing CTA. Light: the footer below it is Deep Ink. */}
      <CtaBlock
        eyebrow="Ready when you are"
        title="Come with us"
        body="Pick a trip or a night out, send a request, and we take it from there."
        actions={
          <>
            <ButtonLink href="/trips" size="large">
              {CTA.exploreTravel}
            </ButtonLink>
            <ButtonLink href="/events" variant="secondary" size="large">
              {CTA.exploreEvents}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
