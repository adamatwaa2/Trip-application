import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { ExploreUniverse } from "@/components/ExploreUniverse";
import { getListedEvents, getListedTrips } from "@/content/source";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: "Explore",
  description: "Move through the travel and events worlds of Planet Infinity.",
};

export default async function ExplorePage() {
  const [{ trips, usingDemoData: tripsAreDemo }, { events, usingDemoData: eventsAreDemo }, copy] = await Promise.all([
    getListedTrips(),
    getListedEvents(),
    getSiteCopy(),
  ]);
  const tripCount = tripsAreDemo ? 0 : trips.length;
  const eventCount = eventsAreDemo ? 0 : events.length;

  return (
    <div className="pi-explore-universe">
      <Container>
        <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Explore" }]} />
        <div className="pi-explore-universe__intro">
          <p className="pi-home-hero__eyebrow">Explore</p>
          <h1>{copy.explore_title}</h1>
          <p>{copy.explore_lede}</p>
        </div>
        <ExploreUniverse tripCount={tripCount} eventCount={eventCount} />
      </Container>
    </div>
  );
}
