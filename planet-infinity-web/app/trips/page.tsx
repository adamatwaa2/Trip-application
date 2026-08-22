import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { EmptyState } from "@/components/EmptyState";
import { Eyebrow } from "@/components/Eyebrow";
import { Grid } from "@/components/Grid";
import { Section } from "@/components/Section";
import { TripCard } from "@/components/TripCard";
import { CTA } from "@/content/cta";
import { getListedTrips } from "@/content/source";

export const metadata: Metadata = {
  title: "Travel",
  description:
    "Trips out of Dahab and across South Sinai — desert and sea, camping and stargazing.",
};

export default function TripsPage() {
  const { trips, usingDemoData } = getListedTrips();

  return (
    <>
      <Section tone="ivory" className="pi-listing-hero">
        <Container>
          <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Travel" }]} />
          <Eyebrow>Travel</Eyebrow>
          <h1 className="pi-listing-hero__title">Every road out of Dahab</h1>
          <p className="pi-listing-hero__lede">
            Desert and sea, camping and stargazing, long roads and short
            escapes. Every trip is planned, staffed and run by us — and no two
            are booked the same way.
          </p>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          {usingDemoData ? (
            <div className="pi-demo-banner" role="note">
              <strong>These are architecture test cases, not real trips.</strong>{" "}
              The four demo configurations below exist to prove that trip
              selection and seat booking work independently. Real trips replace
              them entirely — nothing here is a Planet Infinity departure, and
              no price, date or detail on them is real.
            </div>
          ) : null}

          {trips.length > 0 ? (
            <Grid columns={3}>
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
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
    </>
  );
}
