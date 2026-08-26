/**
 * Planet Infinity — trips.
 *
 * TRIPS holds real trips and is EMPTY until Adam supplies them. Nothing here
 * is invented: no price, date, destination, meeting point or availability.
 *
 * DEMO_TRIPS are architecture test cases. They are shown on the listing only
 * when there are no real trips, always badged, and never on the homepage.
 */
import { DEMO_TRIPS } from "./demo";
import type { Trip } from "./types";

export * from "./types";
export * from "./seatLayouts";
export { DEMO_TRIPS };

/** Real trips only. */
export const TRIPS: Trip[] = [];

/** Real featured trips for the homepage. Demo data never appears there. */
export const FEATURED_TRIPS: Trip[] = TRIPS.filter((t) => t.featured).slice(0, 3);

/**
 * What the /trips listing renders. Falls back to the demo configurations so
 * the four booking paths stay testable, and reports which it used so the page
 * can say so plainly.
 */
export function listedTrips(): { trips: Trip[]; usingDemoData: boolean } {
  if (TRIPS.length > 0) return { trips: TRIPS, usingDemoData: false };
  return { trips: DEMO_TRIPS, usingDemoData: true };
}

/** Every trip that can own a /trips/[slug] route. */
export function allTrips(): Trip[] {
  return [...TRIPS, ...DEMO_TRIPS];
}

export function findTrip(slug: string): Trip | undefined {
  return allTrips().find((trip) => trip.slug === slug);
}

/**
 * The steps a given trip's booking flow actually has. This is the single
 * place the four configurations are resolved — components ask this function
 * rather than reading the two flags themselves, so no component can drift
 * into assuming seats.
 */
export type BookingStep = "selection" | "seats" | "custom" | "guest" | "payment" | "review";

export function bookingSteps(trip: Trip): BookingStep[] {
  const steps: BookingStep[] = [];
  if (trip.tripSelectionEnabled) steps.push("selection");
  if (trip.seatBookingEnabled) steps.push("seats");
  if (trip.bookingFormFields?.length) steps.push("custom");
  steps.push("guest");
  if (trip.paymentProofRequired) steps.push("payment");
  steps.push("review");
  return steps;
}

export const STEP_LABELS: Record<BookingStep, string> = {
  selection: "Your choices",
  seats: "Your seat",
  custom: "Trip questions",
  guest: "Your details",
  payment: "Payment proof",
  review: "Review",
};
