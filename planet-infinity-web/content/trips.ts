/**
 * Planet Infinity — trips.
 *
 * NO SEAT-BOOKING ASSUMPTION. Trip types differ: some need no selection at
 * all, some offer a package or trip selection, a few use seat selection, and
 * some may eventually combine them. Nothing in this model, in TripCard, or on
 * the homepage may assume seats. `bookingMode` is deliberately coarse and
 * open — the real booking logic is designed separately.
 *
 * The list is EMPTY on purpose. No trip, price, date, destination or
 * availability is invented. When real trips arrive they go here, and the
 * homepage and /trips listing pick them up with no component changes.
 */
import type { AvailabilityState } from "./cta";

export type BookingMode =
  /** We approve before any payment. Planet Infinity's normal flow. */
  | "request"
  /** Capacity is live and payable immediately. */
  | "instant";

export type Trip = {
  slug: string;
  title: string;
  /** Where it goes, as Adam writes it. Never derived or guessed. */
  destination: string;
  /** One or two lines. Editorial, not a spec sheet. */
  summary: string;
  /** e.g. "4 days / 3 nights" — supplied as written, never computed. */
  durationLabel?: string;
  /** EGP. Omit entirely when the price is not set; never fill with 0. */
  priceEgp?: number;
  /** Path to real Planet Infinity photography. No stock, no AI imagery. */
  image?: string;
  imageAlt?: string;
  availability?: AvailabilityState;
  bookingMode?: BookingMode;
};

/** Real trips only. Empty until Adam supplies them. */
export const TRIPS: Trip[] = [];

/** What the homepage shows. Kept small on purpose. */
export const FEATURED_TRIPS: Trip[] = TRIPS.slice(0, 3);
