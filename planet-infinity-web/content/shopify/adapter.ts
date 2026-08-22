/**
 * Planet Infinity — Shopify → website adapter.
 *
 * Pure mapping functions. They do not call Shopify; they translate a product
 * payload into the Trip or PlanetEvent shape the site already uses. When the
 * store has real products, the fetch layer hands its results through here and
 * nothing in any component changes.
 *
 * Field names below were verified against the live Admin schema with
 * introspect_admin_schema before this file was written — title, handle,
 * descriptionHtml, productType, tags, status, media, variants, metafields and
 * priceRangeV2 all exist on Product. Nothing here is guessed.
 *
 * ── The rule this file must never break ──────────────────────────────────
 * Mapping must not flatten the booking model. A trip keeps its two
 * independent switches (selection, seats) and an event keeps its own
 * (tickets, quantity, mode). Anything missing from Shopify falls back to the
 * SAFE value — false — so a trip never gains a seat map by accident.
 * ─────────────────────────────────────────────────────────────────────────
 */
import type { AvailabilityState } from "../cta";
import type { PlanetEvent, TicketOption } from "../events";
import type { Trip, TripOptionGroup, SeatConfig, ItineraryStop } from "../trips";

/** The shape we read back from Shopify. A subset of Product. */
export type ShopifyMetafield = { namespace: string; key: string; value: string };

export type ShopifyProductNode = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml?: string | null;
  status?: string;
  media?: { nodes: { alt?: string | null; preview?: { image?: { url: string } | null } | null }[] };
  priceRangeV2?: { minVariantPrice: { amount: string; currencyCode: string } } | null;
  metafields?: { nodes: ShopifyMetafield[] };
};

function read(product: ShopifyProductNode, namespace: string, key: string) {
  return product.metafields?.nodes.find(
    (m) => m.namespace === namespace && m.key === key
  )?.value;
}

function readBool(product: ShopifyProductNode, ns: string, key: string): boolean {
  // Absent means OFF. A missing flag must never switch a step on.
  return read(product, ns, key) === "true";
}

function readList(product: ShopifyProductNode, ns: string, key: string): string[] | undefined {
  const raw = read(product, ns, key);
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : undefined;
  } catch {
    return undefined;
  }
}

function readJson<T>(product: ShopifyProductNode, ns: string, key: string): T | undefined {
  const raw = read(product, ns, key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function readNumber(product: ShopifyProductNode, ns: string, key: string): number | undefined {
  const raw = read(product, ns, key);
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

const AVAILABILITY_VALUES: AvailabilityState[] = [
  "available",
  "fewSpotsLeft",
  "almostFull",
  "soldOut",
];

function readAvailability(
  product: ShopifyProductNode,
  ns: string
): AvailabilityState | undefined {
  const raw = read(product, ns, "availability");
  return AVAILABILITY_VALUES.find((state) => state === raw);
}

/** Price stays undefined when unset — it must never fall back to 0. */
function readPrice(product: ShopifyProductNode): number | undefined {
  const amount = product.priceRangeV2?.minVariantPrice.amount;
  if (!amount) return undefined;
  const n = Number(amount);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function readMedia(product: ShopifyProductNode) {
  const nodes = product.media?.nodes ?? [];
  const images = nodes
    .map((n) => ({ src: n.preview?.image?.url, alt: n.alt ?? "" }))
    .filter((i): i is { src: string; alt: string } => Boolean(i.src));
  const [hero, ...rest] = images;
  return {
    hero: hero?.src,
    heroAlt: hero?.alt,
    gallery: rest.length ? rest : undefined,
  };
}

/** Shopify product (Travel collection) → Trip. */
export function toTrip(product: ShopifyProductNode): Trip {
  const mode = read(product, "trip", "booking_mode");

  return {
    id: product.id,
    slug: product.handle,
    title: product.title,
    shortDescription: read(product, "trip", "short_description") ?? "",
    description: product.descriptionHtml ? [product.descriptionHtml] : [],
    destination: read(product, "trip", "destination") ?? "",
    duration: read(product, "trip", "duration"),
    media: readMedia(product),
    priceEgp: readPrice(product),
    currency: "EGP",
    priceUnit: "per person",
    availability: readAvailability(product, "trip"),
    featured: readBool(product, "trip", "featured"),
    bookingMode: mode === "booking" || mode === "application" ? mode : "request",
    // Both default to false. A trip only gains a step by saying so explicitly.
    tripSelectionEnabled: readBool(product, "trip", "selection_enabled"),
    seatBookingEnabled: readBool(product, "trip", "seat_booking_enabled"),
    optionGroups: readJson<TripOptionGroup[]>(product, "trip", "option_groups"),
    seat: readJson<SeatConfig>(product, "trip", "seat_config"),
    meetingPoint: read(product, "trip", "meeting_point"),
    departureTime: read(product, "trip", "departure_time"),
    included: readList(product, "trip", "included"),
    notIncluded: readList(product, "trip", "not_included"),
    itinerary: readJson<ItineraryStop[]>(product, "trip", "itinerary"),
    importantInformation: readList(product, "trip", "important_information"),
    cancellationSummary: read(product, "trip", "cancellation_summary"),
    faq: readJson<Trip["faq"]>(product, "trip", "faq"),
  };
}

/** Shopify product (Events collection) → PlanetEvent. */
export function toEvent(product: ShopifyProductNode): PlanetEvent {
  const mode = read(product, "event", "booking_mode");
  const ticketType = read(product, "event", "ticket_type");

  return {
    id: product.id,
    slug: product.handle,
    title: product.title,
    shortDescription: read(product, "event", "short_description") ?? "",
    description: product.descriptionHtml ? [product.descriptionHtml] : [],
    category: read(product, "event", "category") ?? "",
    venue: read(product, "event", "venue"),
    eventDate: read(product, "event", "date"),
    startTime: read(product, "event", "start_time"),
    endTime: read(product, "event", "end_time"),
    media: readMedia(product),
    priceEgp: readPrice(product),
    currency: "EGP",
    priceUnit: "per ticket",
    availability: readAvailability(product, "event"),
    featured: readBool(product, "event", "featured"),
    capacity: readNumber(product, "event", "capacity"),
    bookingMode: mode === "request" || mode === "application" ? mode : "booking",
    ticketType:
      ticketType === "tiered" ||
      ticketType === "package" ||
      ticketType === "experience"
        ? ticketType
        : "general",
    // Both default to false, for the same reason as trips.
    ticketSelectionEnabled: readBool(product, "event", "ticket_selection_enabled"),
    quantityEnabled: readBool(product, "event", "quantity_enabled"),
    ticketOptions: readJson<TicketOption[]>(product, "event", "ticket_options"),
    minQuantity: readNumber(product, "event", "min_quantity"),
    maxQuantity: readNumber(product, "event", "max_quantity"),
    whatIsIncluded: readList(product, "event", "included"),
    whatIsNotIncluded: readList(product, "event", "not_included"),
    importantInformation: readList(product, "event", "important_information"),
    cancellationSummary: read(product, "event", "cancellation_summary"),
    faq: readJson<PlanetEvent["faq"]>(product, "event", "faq"),
  };
}
