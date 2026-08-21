/**
 * Planet Infinity — locked CTA lexicon (PI-WB-002, Plate 09).
 *
 * "These strings do not get rewritten per page." Typing every call to action
 * against CTA makes the banned strings unusable by construction rather than
 * by discipline.
 */

export const CTA = {
  /** Entering a world from the homepage. */
  exploreTravel: "Explore travel",
  exploreEvents: "Explore events",
  exploreThemes: "Explore themes",
  /** Instant booking — capacity is live and payable. */
  bookNow: "Book now",
  /** Request mode — we approve before any payment. Planet Infinity's flow. */
  requestToBook: "Request to book",
  /** Events with open ticketing. */
  getTickets: "Get tickets",
  /** Private or curated events. */
  requestAccess: "Request access",
  /** Secondary action on a card or hero. */
  seeDates: "See dates",
  /** Last step before checkout. */
  continueToPayment: "Continue to payment",
  /** Support, everywhere, always visible. */
  talkToUs: "Talk to us on WhatsApp",
} as const;

export type CtaLabel = (typeof CTA)[keyof typeof CTA];

/**
 * Explicitly banned by PI-WB-002. Kept here so the lint rule and code review
 * have something concrete to point at: "If a button can't say what happens
 * when it's pressed, the flow is wrong, not the label."
 */
export const BANNED_CTA_STRINGS = [
  "Submit",
  "Learn more",
  "Click here",
  "Buy now!!!",
  "Discover more",
  "Get started",
] as const;

/**
 * Availability — one vocabulary, four states, same words as the product
 * database. Never "Hurry!", never a countdown we can't honour.
 */
export const AVAILABILITY = {
  available: "AVAILABLE",
  fewSpotsLeft: "FEW SPOTS LEFT",
  almostFull: "ALMOST FULL",
  soldOut: "SOLD OUT",
} as const;

export type AvailabilityState = keyof typeof AVAILABILITY;
