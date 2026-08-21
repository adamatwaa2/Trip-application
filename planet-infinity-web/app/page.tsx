import type { Metadata } from "next";
import { ButtonLink } from "@/components/Button";
import { CardPlaceholder } from "@/components/CardPlaceholder";
import { Container } from "@/components/Container";
import { CtaBlock } from "@/components/CtaBlock";
import { Eyebrow } from "@/components/Eyebrow";
import { Grid } from "@/components/Grid";
import { MediaBlock } from "@/components/MediaBlock";
import { NightField } from "@/components/NightField";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { TripCard } from "@/components/TripCard";
import { EventCard } from "@/components/EventCard";
import { CTA } from "@/content/cta";
import { FEATURED_EVENTS } from "@/content/events";
import { FEATURED_TRIPS } from "@/content/trips";

export const metadata: Metadata = {
  title: "Trips and events out of Dahab",
  description:
    "Planet Infinity Entertainment runs trips and events out of Dahab, South Sinai — planned end to end, so you only carry the memories.",
};

/**
 * The Planet Infinity homepage.
 *
 * Section rhythm alternates light and Deep Ink for pace, within the limits in
 * CLAUDE.md: exactly ONE night field on this page (The Two Worlds), plus the
 * footer, and the two are separated by How it works and the closing CTA so no
 * two dark sections ever touch.
 *
 * Nothing here invents business information. Trips and events render from
 * content/*.ts, which is empty until Adam supplies real ones; until then the
 * sections show the shape the content will take and say so plainly.
 */
export default function HomePage() {
  return (
    <>
      {/* 2 — Hero */}
      <Section tone="ivory" className="pi-hero">
        <Container>
          <div className="pi-hero__text">
            <Eyebrow>Planet Infinity · Dahab · South Sinai</Eyebrow>
            <h1 className="pi-hero__title">Escape the ordinary</h1>
            <p className="pi-hero__lede">
              Trips into the desert and the sea, and the nights that happen
              after them. We run the whole thing end to end — so you only carry
              the memories.
            </p>
            <div className="pi-hero__actions">
              <ButtonLink href="/trips" size="large">
                {CTA.exploreTravel}
              </ButtonLink>
              <ButtonLink href="/events" variant="secondary" size="large">
                {CTA.exploreEvents}
              </ButtonLink>
            </div>
          </div>
        </Container>
        <Container className="pi-hero__media">
          <MediaBlock ratio="21-9" radius="hero" />
        </Container>
      </Section>

      {/* 3 — Introduction / positioning */}
      <Section tone="white">
        <Container size="read">
          <div className="pi-intro">
            <Eyebrow>Who we are</Eyebrow>
            <p className="pi-intro__lead">
              Planet Infinity is two things at once: a travel company and an
              events company, run by the same people, out of the same town.
            </p>
            <p>
              One week it is a road into the desert, a camp under the stars and
              a sunrise nobody photographs properly. The next it is a beach, a
              sound system and a night that goes until the light comes back.
              Same crew, same standards, same phone number.
            </p>
            <p>
              We are not a booking form with a logo on it. Every trip and every
              event is planned, staffed and run by us, and the person who
              answers your message is the person who will be there on the day.
            </p>
          </div>
        </Container>
      </Section>

      {/* 4 — Trips */}
      <Section tone="ivory" id="trips">
        <Container>
          <SectionHeading
            eyebrow="Travel"
            title="Where we're going"
            lede="Desert and sea, camping and stargazing, long roads and short escapes."
            action={
              <ButtonLink href="/trips" variant="secondary">
                {CTA.exploreTravel}
              </ButtonLink>
            }
          />

          {FEATURED_TRIPS.length > 0 ? (
            <Grid columns={3}>
              {FEATURED_TRIPS.map((trip) => (
                <TripCard key={trip.slug} trip={trip} />
              ))}
            </Grid>
          ) : (
            <>
              <Grid columns={3}>
                <CardPlaceholder label="Trip awaiting content" />
                <CardPlaceholder label="Trip awaiting content" />
                <CardPlaceholder label="Trip awaiting content" />
              </Grid>
              <p className="pi-section-note">
                The next departures are being confirmed. Trip names, dates and
                prices go live here as soon as they are set — nothing is listed
                before it is real.
              </p>
            </>
          )}
        </Container>
      </Section>

      {/* 5 — Events */}
      <Section tone="white" id="events">
        <Container>
          <SectionHeading
            eyebrow="Events"
            title="And the nights after"
            lede="Beach sessions, movie nights, full-moon parties. The other half of what we do."
            action={
              <ButtonLink href="/events" variant="secondary">
                {CTA.exploreEvents}
              </ButtonLink>
            }
          />

          {FEATURED_EVENTS.length > 0 ? (
            <Grid columns={3}>
              {FEATURED_EVENTS.map((event) => (
                <EventCard key={event.slug} event={event} />
              ))}
            </Grid>
          ) : (
            <>
              <Grid columns={3}>
                <CardPlaceholder label="Event awaiting content" />
                <CardPlaceholder label="Event awaiting content" />
                <CardPlaceholder label="Event awaiting content" />
              </Grid>
              <p className="pi-section-note">
                The next dates are being locked in. Line-ups, venues and ticket
                details appear here once they are confirmed.
              </p>
            </>
          )}
        </Container>
      </Section>

      {/* 6 — The two worlds. This page's single Deep Ink section. */}
      <NightField>
        <Container>
          <SectionHeading
            eyebrow="The experience"
            title="Two worlds, one crew"
            lede="Each world has its own atmosphere. Neither is a side project."
          />
          <Grid columns={2}>
            <article className="pi-world">
              <p className="pi-world__number">01</p>
              <h3 className="pi-world__title">Travel</h3>
              <p className="pi-world__body">
                Trips, experiences, camping, stargazing, desert and sea. The
                Sinai catalogue and everything that moves through it — first
                light, last light, and long shadows in between.
              </p>
              <ButtonLink href="/trips" variant="tertiary">
                {CTA.exploreTravel}
              </ButtonLink>
            </article>
            <article className="pi-world">
              <p className="pi-world__number">02</p>
              <h3 className="pi-world__title">Events</h3>
              <p className="pi-world__body">
                Raves, beach festivals, movie nights, match nights, full-moon
                sessions. After dark, hard sources, colour spill and grain —
                run with the same crew and the same standards.
              </p>
              <ButtonLink href="/events" variant="tertiary">
                {CTA.exploreEvents}
              </ButtonLink>
            </article>
          </Grid>
        </Container>
      </NightField>

      {/* 7 — How it works */}
      <Section tone="ivory">
        <Container>
          <SectionHeading
            eyebrow="How it works"
            title="From a message to a confirmation"
            lede="No surprises, no small print you find out about later."
            align="center"
          />
          <Grid columns={4}>
            <div className="pi-step">
              <p className="pi-step__number">01</p>
              <h3 className="pi-step__title">Send a request</h3>
              <p className="pi-step__body">
                Tell us which trip or event, and who is coming with you. A
                request is not a booking yet — nothing is charged.
              </p>
            </div>
            <div className="pi-step">
              <p className="pi-step__number">02</p>
              <h3 className="pi-step__title">We confirm availability</h3>
              <p className="pi-step__body">
                We check every service on the trip against our suppliers and
                come back to you with what is actually available.
              </p>
            </div>
            <div className="pi-step">
              <p className="pi-step__number">03</p>
              <h3 className="pi-step__title">A deposit holds it</h3>
              <p className="pi-step__body">
                A deposit starts the booking. The balance is settled before the
                trip, on the terms you agreed up front.
              </p>
            </div>
            <div className="pi-step">
              <p className="pi-step__number">04</p>
              <h3 className="pi-step__title">Confirmation lands</h3>
              <p className="pi-step__body">
                Once everything is paid and confirmed you get a written Booking
                Confirmation with every detail on it.
              </p>
            </div>
          </Grid>
        </Container>
      </Section>

      {/* 8 — Closing CTA. Light on purpose: the footer below it is Deep Ink,
          and two dark sections must never sit next to each other. */}
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
