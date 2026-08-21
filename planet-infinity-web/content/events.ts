/**
 * Planet Infinity — events.
 *
 * Events are a first-class offering alongside trips, not a sub-category of
 * travel. Ticketing differs per event, so `ticketMode` stays coarse until the
 * event booking system is designed.
 *
 * The list is EMPTY on purpose. No event name, date, venue, price, lineup or
 * availability is invented.
 */
import type { AvailabilityState } from "./cta";

export type TicketMode =
  /** Open ticketing. */
  | "tickets"
  /** Private or curated — we approve the guest list. */
  | "access";

export type PlanetEvent = {
  slug: string;
  title: string;
  /** e.g. "Beach festival", "Movie night" — as written, never inferred. */
  kind: string;
  summary: string;
  /** Written exactly as supplied. Never formatted from a date object. */
  dateLabel?: string;
  venue?: string;
  /** EGP. Omit when unset. */
  priceEgp?: number;
  image?: string;
  imageAlt?: string;
  availability?: AvailabilityState;
  ticketMode?: TicketMode;
};

/** Real events only. Empty until Adam supplies them. */
export const EVENTS: PlanetEvent[] = [];

export const FEATURED_EVENTS: PlanetEvent[] = EVENTS.slice(0, 3);
