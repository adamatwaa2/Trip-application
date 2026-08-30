/**
 * Planet Infinity — trip model.
 *
 * ── The one rule this model exists to protect ────────────────────────────
 * Trip selection and seat booking are INDEPENDENT capabilities. A trip may
 * have neither, either, or both:
 *
 *   A  selection off · seats off   the normal case
 *   B  selection on  · seats off   package / date / edition choice
 *   C  selection off · seats on    rare
 *   D  selection on  · seats on    rare
 *
 * Seat booking is never the default and never implied. A seat map appears
 * only where `seatBookingEnabled` is explicitly true on that trip.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ── Future Shopify shape ─────────────────────────────────────────────────
 * Every field below is designed to be fed later by a Shopify product plus
 * metafields, without changing any component. See SHOPIFY_FIELD_MAP at the
 * bottom of this file for the intended mapping. No Shopify code exists yet
 * and no product has been created.
 * ─────────────────────────────────────────────────────────────────────────
 */
import type { AvailabilityState } from "../cta";
import type { BookingFormField } from "@/lib/booking-form";

export type Currency = "EGP";

/** How a trip is transacted. Not every trip uses the same path. */
export type BookingMode =
  /** Capacity is live and payable. */
  | "booking"
  /** Legacy/manual approval path. Direct booking is the normal path. */
  | "request"
  /** The guest applies and we curate; see /apply. */
  | "application";

/** What a selection step is choosing between. */
export type OptionKind = "date" | "package" | "variant" | "edition" | "option";

export type TripChoice = {
  id: string;
  label: string;
  /** One short clarifying line. Optional. */
  detail?: string;
  /** ISO departure time for a date choice. It is validated again by the database. */
  scheduledAt?: string;
  /** ISO return time for this departure choice. */
  returnAt?: string;
  /** Duration for this departure choice. */
  duration?: string;
  /** Absolute price for this choice, when the choice sets the price. */
  priceEgp?: number;
  /** Or an adjustment on the trip's base price. */
  priceDeltaEgp?: number;
  soldOut?: boolean;
};

export type TripOptionGroup = {
  id: string;
  kind: OptionKind;
  label: string;
  /** A short help line under the group label. */
  hint?: string;
  /** Most groups are required once selection is enabled. */
  required?: boolean;
  choices: TripChoice[];
};

/** Seat map geometry. Only used by trips with seatBookingEnabled. */
export type SeatRow = {
  /** Seats on the left of the aisle. "driver" renders the driver position. */
  left: (number | "driver")[];
  /** Seats on the right of the aisle. */
  right: number[];
  /** A back row has no aisle — seats run edge to edge. */
  contiguous?: boolean;
};

export type SeatLayout = {
  /** e.g. "Toyota Hiace · 14 seats". Written, never derived. */
  label: string;
  rows: SeatRow[];
};

export type SeatConfig = {
  layout: SeatLayout;
  /** Seats already booked. */
  taken?: number[];
  /** Seats that exist but are not sellable on this departure. */
  unavailable?: number[];
};

export type ItineraryStop = {
  /** e.g. "Day 1" — written as supplied. */
  label: string;
  title: string;
  body: string;
};

export type FaqItem = { question: string; answer: string };

export type GalleryImage = { src: string; alt: string; type?: "image" | "video"; poster?: string };

export type Trip = {
  id: string;
  slug: string;
  title: string;
  /** One line for cards. */
  shortDescription: string;
  /** A few paragraphs for the detail page overview. */
  description: string[];

  destination: string;
  /** e.g. "4 days / 3 nights" — written as supplied, never computed. */
  duration?: string;

  media: {
    /** Real Planet Infinity photography only. Omit until the shoot exists. */
    hero?: string;
    heroAlt?: string;
    gallery?: GalleryImage[];
    /** Uploaded first-party video. The hero image is used as its poster. */
    video?: string;
  };

  /** A guest-facing PDF presented as a branded card, never a raw URL. */
  document?: { url: string; label: string };

  /** Base price. Omit entirely when unset — never 0, never "from". */
  priceEgp?: number;
  currency: Currency;
  /** The unit the price is quoted in. */
  priceUnit?: string;

  availability?: AvailabilityState;
  featured?: boolean;

  bookingMode: BookingMode;

  /** Independent curation gate. It does not change the post-approval booking mode. */
  applicationRequired?: boolean;

  /** INDEPENDENT of seatBookingEnabled. */
  tripSelectionEnabled: boolean;
  /** INDEPENDENT of tripSelectionEnabled. Rare. Never defaulted to true. */
  seatBookingEnabled: boolean;

  /** Only read when tripSelectionEnabled. */
  optionGroups?: TripOptionGroup[];
  /** Only read when seatBookingEnabled. */
  seat?: SeatConfig;

  /** Fixed contact fields are always present; these are trip-specific additions. */
  bookingFormFields?: BookingFormField[];
  /** Requires a private receipt image before this booking request is submitted. */
  paymentProofRequired?: boolean;
  /** Lets this trip collect an optional song request for the shared playlist. */
  songRequestEnabled?: boolean;

  meetingPoint?: string;
  departureTime?: string;
  returnTime?: string;
  departurePoint?: string;
  returnPoint?: string;
  packageLabel?: string;
  accommodation?: string;
  transportation?: string;

  included?: string[];
  notIncluded?: string[];
  itinerary?: ItineraryStop[];
  importantInformation?: string[];
  /** Short summary; the full policy lives in the policy documents. */
  cancellationSummary?: string;
  faq?: FaqItem[];

  /** Overrides the CTA the booking module would pick from bookingMode. */
  ctaLabelOverride?: string;
  ctaHelper?: string;

  /**
   * Architecture test case, not a real Planet Infinity trip. Demo trips are
   * badged everywhere they render and are never mixed into real listings.
   */
  isDemo?: boolean;
};

/**
 * Intended Shopify mapping for later. Documentation only — there is no
 * Shopify code, no product, and no Admin API call anywhere in this project.
 * Before any of this is implemented, introspect_admin_schema must be called
 * for each type (CLAUDE.md rule 3).
 */
export const SHOPIFY_FIELD_MAP = {
  title: "product.title",
  slug: "product.handle",
  shortDescription: "metafield: trip.short_description",
  description: "product.descriptionHtml",
  destination: "metafield: trip.destination",
  duration: "metafield: trip.duration",
  priceEgp: "variant.price",
  currency: "shop.currencyCode",
  availability: "metafield: trip.availability",
  bookingMode: "metafield: trip.booking_mode",
  applicationRequired: "metafield: trip.application_required",
  tripSelectionEnabled: "metafield: trip.selection_enabled",
  seatBookingEnabled: "metafield: trip.seat_booking_enabled",
  optionGroups: "product options / variants, or metafield: trip.option_groups",
  seat: "metafield: trip.seat_config",
  bookingFormFields: "metafield: trip.booking_form_fields",
  paymentProofRequired: "metafield: trip.payment_proof_required",
  included: "metafield: trip.included",
  notIncluded: "metafield: trip.not_included",
  itinerary: "metafield: trip.itinerary",
  importantInformation: "metafield: trip.important_information",
  cancellationSummary: "metafield: trip.cancellation_summary",
  faq: "metafield: trip.faq",
  document: "metafield: trip.document",
  media: "product.media",
} as const;
