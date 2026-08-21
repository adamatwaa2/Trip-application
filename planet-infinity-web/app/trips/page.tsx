import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { Grid } from "@/components/Grid";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { TripCard } from "@/components/TripCard";
import { CTA } from "@/content/cta";
import { TRIPS } from "@/content/trips";

export const metadata: Metadata = {
  title: "Travel",
  description:
    "Trips out of Dahab and across South Sinai — desert and sea, camping and stargazing.",
};

/**
 * Trips listing.
 *
 * Deliberately minimal: it exists so navigation and homepage CTAs lead
 * somewhere real instead of a 404. The full trip system — detail pages at
 * /trips/[slug], filtering, and booking — is designed separately, and no
 * booking mode is assumed here.
 */
export default function TripsPage() {
  return (
    <Section tone="ivory">
      <Container>
        <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Travel" }]} />
        <SectionHeading
          eyebrow="Travel"
          title="Every road out of Dahab"
          lede="Desert and sea, camping and stargazing, long roads and short escapes."
          level="h1"
          as="h1"
        />

        {TRIPS.length > 0 ? (
          <Grid columns={3}>
            {TRIPS.map((trip) => (
              <TripCard key={trip.slug} trip={trip} />
            ))}
          </Grid>
        ) : (
          <EmptyState
            title="The trip line-up is being finalised"
            body="Departures, prices and meeting points are confirmed before anything is listed here. Nothing goes up until it is real and bookable."
            action={
              <ButtonLink href="/events" variant="secondary">
                {CTA.exploreEvents}
              </ButtonLink>
            }
          />
        )}
      </Container>
    </Section>
  );
}
