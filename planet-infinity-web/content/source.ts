/**
 * Planet Infinity — the site's data source.
 *
 * Every page reads trips and events through this module rather than importing
 * arrays directly. That makes the Shopify switch a change to ONE file:
 *
 *   Shopify  →  Travel / Events collections
 *            →  content/shopify/adapter.ts  (toTrip / toEvent)
 *            →  this module
 *            →  listing → detail → the correct booking flow
 *
 * Today it serves local data: real trips and events (both empty) with the
 * demo configurations as a fallback for the listing pages only. No production
 * data is hardcoded in any component.
 *
 * When the store has products, replace the bodies below with a fetch that maps
 * through the adapter. The booking model survives that swap untouched, because
 * the flows read the trip's and event's own switches, not the data source.
 */
import {
  EVENTS,
  FEATURED_EVENTS,
  allEvents,
  findEvent,
  listedEvents,
  type PlanetEvent,
} from "./events";
import {
  FEATURED_TRIPS,
  TRIPS,
  allTrips,
  findTrip,
  listedTrips,
  type Trip,
} from "./trips";

/** Where the data currently comes from. Flips to "shopify" with the fetch. */
export const DATA_SOURCE: "local" | "shopify" = "local";

/* ---------------------------------- trips --------------------------------- */

export function getTrips(): Trip[] {
  return TRIPS;
}

/** Listing data, plus whether it fell back to the demo configurations. */
export function getListedTrips(): { trips: Trip[]; usingDemoData: boolean } {
  return listedTrips();
}

export function getFeaturedTrips(): Trip[] {
  return FEATURED_TRIPS;
}

export function getTripBySlug(slug: string): Trip | undefined {
  return findTrip(slug);
}

/** Every slug that should own a route. */
export function getTripSlugs(): string[] {
  return allTrips().map((trip) => trip.slug);
}

/* --------------------------------- events --------------------------------- */

export function getEvents(): PlanetEvent[] {
  return EVENTS;
}

export function getListedEvents(): {
  events: PlanetEvent[];
  usingDemoData: boolean;
} {
  return listedEvents();
}

export function getFeaturedEvents(): PlanetEvent[] {
  return FEATURED_EVENTS;
}

export function getEventBySlug(slug: string): PlanetEvent | undefined {
  return findEvent(slug);
}

export function getEventSlugs(): string[] {
  return allEvents().map((event) => event.slug);
}
