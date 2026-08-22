/**
 * Planet Infinity — events.
 *
 * EVENTS holds real events and is EMPTY until Adam supplies them. Nothing
 * here is invented: no name, date, time, venue, price, capacity or ticket.
 *
 * DEMO_EVENTS are architecture test cases. They appear on the listing only
 * when there are no real events, always badged, and never on the homepage.
 */
import { DEMO_EVENTS } from "./demo";
import type { PlanetEvent, TicketOption } from "./types";

export * from "./types";
export { DEMO_EVENTS };

/** Real events only. */
export const EVENTS: PlanetEvent[] = [];

/** Real featured events for the homepage. Demo data never appears there. */
export const FEATURED_EVENTS: PlanetEvent[] = EVENTS.filter(
  (event) => event.featured
).slice(0, 3);

/** What the /events listing renders, and whether it fell back to demo data. */
export function listedEvents(): {
  events: PlanetEvent[];
  usingDemoData: boolean;
} {
  if (EVENTS.length > 0) return { events: EVENTS, usingDemoData: false };
  return { events: DEMO_EVENTS, usingDemoData: true };
}

export function allEvents(): PlanetEvent[] {
  return [...EVENTS, ...DEMO_EVENTS];
}

export function findEvent(slug: string): PlanetEvent | undefined {
  return allEvents().find((event) => event.slug === slug);
}

/**
 * The steps a given event's flow actually has. This is the single place the
 * event configurations are resolved — components ask this function rather
 * than reading the switches themselves.
 *
 * Events have no seat step. That is deliberate: seating is a trip concept
 * today, and an event seating model is a separate decision.
 */
export type EventBookingStep =
  | "tickets"
  | "quantity"
  | "guest"
  | "review"
  | "application";

export function eventBookingSteps(event: PlanetEvent): EventBookingStep[] {
  // A curated event is a single request, not a checkout.
  if (event.bookingMode === "application") return ["application"];

  const steps: EventBookingStep[] = [];
  if (event.ticketSelectionEnabled) steps.push("tickets");
  if (event.quantityEnabled) steps.push("quantity");
  steps.push("guest", "review");
  return steps;
}

export const EVENT_STEP_LABELS: Record<EventBookingStep, string> = {
  tickets: "Your ticket",
  quantity: "How many",
  guest: "Your details",
  review: "Review",
  application: "Request to attend",
};

/** Quantity limits for the chosen ticket, falling back to event level. */
export function quantityLimits(
  event: PlanetEvent,
  ticket?: TicketOption
): { min: number; max: number } {
  const min = ticket?.minQuantity ?? event.minQuantity ?? 1;
  const available = ticket?.availableQuantity;
  const max = Math.min(
    ticket?.maxQuantity ?? event.maxQuantity ?? 10,
    available ?? Number.POSITIVE_INFINITY
  );
  return { min, max: Math.max(min, max) };
}
