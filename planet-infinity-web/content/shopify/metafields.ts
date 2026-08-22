/**
 * Planet Infinity — planned Shopify metafield definitions.
 *
 * ── NOTHING HERE HAS BEEN CREATED IN SHOPIFY ─────────────────────────────
 * This file is a verified plan, not a migration. No metafield definition,
 * product or collection has been created or modified on planetinfinity.online.
 * Creating them is a store change and needs Adam's approval first.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Everything below was checked against the live store before being written:
 *   · MetafieldDefinitionInput fields (namespace, key, name, description,
 *     ownerType, type, validations, pin, access) — introspect_admin_schema
 *   · MetafieldOwnerType.PRODUCT is a valid enum value — introspect_admin_schema
 *   · every `type` string is from Shopify's supported metafield type list
 *
 * Trips and Events keep separate namespaces on purpose. They are two products
 * with two booking models, and flattening them into one namespace is how a
 * "generic booking" creeps in later.
 */

export type PlannedMetafield = {
  namespace: "trip" | "event";
  key: string;
  name: string;
  /** A Shopify supported metafield type. */
  type: string;
  ownerType: "PRODUCT";
  description: string;
};

/** Trip fields that Shopify metafields would supply. */
export const TRIP_METAFIELDS: PlannedMetafield[] = [
  { namespace: "trip", key: "short_description", name: "Short description", type: "single_line_text_field", ownerType: "PRODUCT", description: "One line, used on trip cards." },
  { namespace: "trip", key: "destination", name: "Destination", type: "single_line_text_field", ownerType: "PRODUCT", description: "Where the trip goes, written as-is." },
  { namespace: "trip", key: "duration", name: "Duration", type: "single_line_text_field", ownerType: "PRODUCT", description: "e.g. 4 days / 3 nights. Written, never computed." },
  { namespace: "trip", key: "availability", name: "Availability", type: "single_line_text_field", ownerType: "PRODUCT", description: "One of: available, fewSpotsLeft, almostFull, soldOut." },
  { namespace: "trip", key: "featured", name: "Featured", type: "boolean", ownerType: "PRODUCT", description: "Show on the homepage." },
  { namespace: "trip", key: "booking_mode", name: "Booking mode", type: "single_line_text_field", ownerType: "PRODUCT", description: "One of: booking, request, application." },
  { namespace: "trip", key: "selection_enabled", name: "Trip selection enabled", type: "boolean", ownerType: "PRODUCT", description: "Does this trip have a selection step? Independent of seats." },
  { namespace: "trip", key: "seat_booking_enabled", name: "Seat booking enabled", type: "boolean", ownerType: "PRODUCT", description: "RARE. Does this trip use a seat map? Independent of selection." },
  { namespace: "trip", key: "option_groups", name: "Option groups", type: "json", ownerType: "PRODUCT", description: "Dates, packages, variants, editions. Shape: TripOptionGroup[]." },
  { namespace: "trip", key: "seat_config", name: "Seat configuration", type: "json", ownerType: "PRODUCT", description: "Layout, taken and unavailable seats. Shape: SeatConfig." },
  { namespace: "trip", key: "meeting_point", name: "Meeting point", type: "single_line_text_field", ownerType: "PRODUCT", description: "Written as supplied." },
  { namespace: "trip", key: "departure_time", name: "Departure time", type: "single_line_text_field", ownerType: "PRODUCT", description: "Written as supplied." },
  { namespace: "trip", key: "included", name: "Included", type: "list.single_line_text_field", ownerType: "PRODUCT", description: "What the package covers." },
  { namespace: "trip", key: "not_included", name: "Not included", type: "list.single_line_text_field", ownerType: "PRODUCT", description: "What it does not cover." },
  { namespace: "trip", key: "itinerary", name: "Itinerary", type: "json", ownerType: "PRODUCT", description: "Shape: ItineraryStop[] — label, title, body." },
  { namespace: "trip", key: "important_information", name: "Important information", type: "list.single_line_text_field", ownerType: "PRODUCT", description: "Pre-departure notes." },
  { namespace: "trip", key: "cancellation_summary", name: "Cancellation summary", type: "multi_line_text_field", ownerType: "PRODUCT", description: "Short summary. The full policy lives in the policy documents." },
  { namespace: "trip", key: "faq", name: "FAQ", type: "json", ownerType: "PRODUCT", description: "Shape: { question, answer }[]." },
];

/** Event fields that Shopify metafields would supply. */
export const EVENT_METAFIELDS: PlannedMetafield[] = [
  { namespace: "event", key: "short_description", name: "Short description", type: "single_line_text_field", ownerType: "PRODUCT", description: "One line, used on event cards." },
  { namespace: "event", key: "category", name: "Category", type: "single_line_text_field", ownerType: "PRODUCT", description: "e.g. Beach session, Movie night." },
  { namespace: "event", key: "venue", name: "Venue", type: "single_line_text_field", ownerType: "PRODUCT", description: "Written as supplied." },
  { namespace: "event", key: "date", name: "Event date", type: "date", ownerType: "PRODUCT", description: "The date the event runs." },
  { namespace: "event", key: "start_time", name: "Start time", type: "single_line_text_field", ownerType: "PRODUCT", description: "Written as supplied." },
  { namespace: "event", key: "end_time", name: "End time", type: "single_line_text_field", ownerType: "PRODUCT", description: "Written as supplied." },
  { namespace: "event", key: "availability", name: "Availability", type: "single_line_text_field", ownerType: "PRODUCT", description: "One of: available, fewSpotsLeft, almostFull, soldOut." },
  { namespace: "event", key: "featured", name: "Featured", type: "boolean", ownerType: "PRODUCT", description: "Show on the homepage." },
  { namespace: "event", key: "capacity", name: "Capacity", type: "number_integer", ownerType: "PRODUCT", description: "Total places, when known." },
  { namespace: "event", key: "booking_mode", name: "Booking mode", type: "single_line_text_field", ownerType: "PRODUCT", description: "One of: booking, request, application." },
  { namespace: "event", key: "ticket_type", name: "Ticket type", type: "single_line_text_field", ownerType: "PRODUCT", description: "One of: general, tiered, package, experience." },
  { namespace: "event", key: "ticket_selection_enabled", name: "Ticket selection enabled", type: "boolean", ownerType: "PRODUCT", description: "Does this event have a ticket step? Independent of quantity." },
  { namespace: "event", key: "quantity_enabled", name: "Quantity enabled", type: "boolean", ownerType: "PRODUCT", description: "Does this event have a quantity step? Independent of tickets." },
  { namespace: "event", key: "ticket_options", name: "Ticket options", type: "json", ownerType: "PRODUCT", description: "Shape: TicketOption[], including per-option quantity limits." },
  { namespace: "event", key: "min_quantity", name: "Minimum quantity", type: "number_integer", ownerType: "PRODUCT", description: "Event-level fallback." },
  { namespace: "event", key: "max_quantity", name: "Maximum quantity", type: "number_integer", ownerType: "PRODUCT", description: "Event-level fallback." },
  { namespace: "event", key: "included", name: "Included", type: "list.single_line_text_field", ownerType: "PRODUCT", description: "What the ticket covers." },
  { namespace: "event", key: "not_included", name: "Not included", type: "list.single_line_text_field", ownerType: "PRODUCT", description: "What it does not cover." },
  { namespace: "event", key: "important_information", name: "Important information", type: "list.single_line_text_field", ownerType: "PRODUCT", description: "Entry conditions and notes." },
  { namespace: "event", key: "cancellation_summary", name: "Cancellation summary", type: "multi_line_text_field", ownerType: "PRODUCT", description: "Short summary." },
  { namespace: "event", key: "faq", name: "FAQ", type: "json", ownerType: "PRODUCT", description: "Shape: { question, answer }[]." },
];

/**
 * The two collections the site expects. Neither exists on the store yet, and
 * neither has been created — see the Prompt 4 report.
 *
 * Travel and Events stay separate collections. One combined "products"
 * collection would make the listing pages guess which model to apply.
 */
export const PLANNED_COLLECTIONS = [
  { title: "Travel", handle: "travel", feeds: "/trips" },
  { title: "Events", handle: "events", feeds: "/events" },
] as const;
