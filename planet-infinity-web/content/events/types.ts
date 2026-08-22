/**
 * Planet Infinity — event model.
 *
 * ── Independent from Trips ───────────────────────────────────────────────
 * Events are a first-class product with their own booking architecture. They
 * do NOT reuse the trip flow, and they have NO seat model: a trip's seat map
 * never appears on an event. Trips and Events deliberately stay two small
 * systems rather than one large conditional one.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ── What an event's flow contains ────────────────────────────────────────
 * Three independent switches, resolved in one place by eventBookingSteps():
 *
 *   bookingMode              booking · request · application
 *   ticketSelectionEnabled   does the guest choose a ticket type?
 *   quantityEnabled          does the guest choose how many?
 *
 * Nothing is assumed. An event with none of them enabled goes straight to
 * guest details.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ── Future Shopify shape ─────────────────────────────────────────────────
 * See SHOPIFY_FIELD_MAP at the bottom. No Shopify code, no product, no Admin
 * API call exists — that work starts with introspect_admin_schema.
 * ─────────────────────────────────────────────────────────────────────────
 */
import type { AvailabilityState } from "../cta";

export type Currency = "EGP";

/** How an event is transacted. */
export type EventBookingMode =
  /** Open ticketing — capacity is live. */
  | "booking"
  /** We confirm before anything is charged. */
  | "request"
  /** Private or curated: the guest applies and we approve the list. */
  | "application";

/** What the ticket step is choosing between, when there is one. */
export type TicketType = "general" | "tiered" | "package" | "experience";

export type TicketOption = {
  id: string;
  label: string;
  /** One short clarifying line. */
  detail?: string;
  /** EGP. Omit when unset — never 0, never "from". */
  priceEgp?: number;
  availability?: AvailabilityState;
  soldOut?: boolean;
  /** Quantity limits, when this option allows more than one. */
  minQuantity?: number;
  maxQuantity?: number;
  /** How many remain, when known. */
  availableQuantity?: number;
};

export type EventGalleryImage = { src: string; alt: string };

export type FaqItem = { question: string; answer: string };

export type PlanetEvent = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string[];

  /** e.g. "Beach session", "Movie night" — as written, never inferred. */
  category: string;
  /** Written exactly as supplied. Omit when unknown. */
  venue?: string;
  /** Written exactly as supplied — never formatted from a Date object. */
  eventDate?: string;
  startTime?: string;
  endTime?: string;

  media: {
    /** Real Planet Infinity photography only. */
    hero?: string;
    heroAlt?: string;
    gallery?: EventGalleryImage[];
  };

  /** Base price. Omit entirely when unset. */
  priceEgp?: number;
  currency: Currency;
  priceUnit?: string;

  availability?: AvailabilityState;
  featured?: boolean;
  /** Total capacity, when known. */
  capacity?: number;

  bookingMode: EventBookingMode;
  ticketType?: TicketType;

  /** INDEPENDENT of quantityEnabled. */
  ticketSelectionEnabled: boolean;
  /** INDEPENDENT of ticketSelectionEnabled. */
  quantityEnabled: boolean;

  /** Only read when ticketSelectionEnabled. */
  ticketOptions?: TicketOption[];
  /** Event-level fallback limits when a ticket option sets none. */
  minQuantity?: number;
  maxQuantity?: number;

  whatIsIncluded?: string[];
  whatIsNotIncluded?: string[];
  importantInformation?: string[];
  cancellationSummary?: string;
  faq?: FaqItem[];

  ctaLabelOverride?: string;
  ctaHelper?: string;

  /** Architecture test case, not a real Planet Infinity event. */
  isDemo?: boolean;
};

/**
 * Intended Shopify mapping for later. Documentation only — there is no
 * Shopify code, no product and no Admin API call in this project. Before any
 * of it is implemented, introspect_admin_schema must be called for each type
 * (CLAUDE.md rule 3).
 */
export const SHOPIFY_FIELD_MAP = {
  title: "product.title",
  slug: "product.handle",
  shortDescription: "metafield: event.short_description",
  description: "product.descriptionHtml",
  category: "metafield: event.category",
  venue: "metafield: event.venue",
  eventDate: "metafield: event.date",
  startTime: "metafield: event.start_time",
  endTime: "metafield: event.end_time",
  priceEgp: "variant.price",
  currency: "shop.currencyCode",
  availability: "metafield: event.availability",
  capacity: "metafield: event.capacity",
  bookingMode: "metafield: event.booking_mode",
  ticketType: "metafield: event.ticket_type",
  ticketSelectionEnabled: "metafield: event.ticket_selection_enabled",
  quantityEnabled: "metafield: event.quantity_enabled",
  ticketOptions: "product variants, or metafield: event.ticket_options",
  minQuantity: "metafield: event.min_quantity",
  maxQuantity: "metafield: event.max_quantity",
  whatIsIncluded: "metafield: event.included",
  whatIsNotIncluded: "metafield: event.not_included",
  importantInformation: "metafield: event.important_information",
  cancellationSummary: "metafield: event.cancellation_summary",
  faq: "metafield: event.faq",
  media: "product.media",
} as const;
