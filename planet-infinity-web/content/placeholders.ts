/**
 * Planet Infinity — unknown business data.
 *
 * THIS IS THE ONLY FILE THAT NEEDS EDITING WHEN REAL INFORMATION ARRIVES.
 *
 * Nothing in here is invented. Every entry is a value Adam has not supplied
 * yet: prices, dates, meeting points, contacts, availability, references.
 * Rendering one produces a loud dashed marker on the page, so a placeholder
 * can never quietly ship as if it were real.
 *
 * To replace a value: change `null` to the real string. The marker disappears
 * and the real value renders in its place. Run `npm run placeholders` to list
 * everything still outstanding.
 */

export type PlaceholderEntry = {
  /** What shows on the page while the value is unknown. */
  label: string;
  /** The real value. `null` until Adam supplies it. */
  value: string | null;
  /** Where this came from / what it feeds, for whoever fills it in. */
  note?: string;
};

export const PLACEHOLDERS = {
  // --- contact -----------------------------------------------------------
  whatsapp: {
    label: "WhatsApp number",
    value: null,
    note: "Booking Confirmation PDF · 'Need help?' block",
  },
  reservationsEmail: {
    label: "Reservations email",
    value: null,
    note: "Booking Confirmation PDF · reservations@…",
  },
  emergencyContact: {
    label: "Emergency contact",
    value: null,
    note: "Booking Confirmation PDF · 'Need help?' block",
  },
  officeHours: {
    label: "Office hours",
    value: null,
    note: "Booking Confirmation PDF · 'Need help?' block",
  },
  instagramHandle: {
    label: "Instagram handle",
    value: "@planetinfinity.ent",
    note: "Confirmed — appears in PI-WB-002 footer",
  },

  // --- trip --------------------------------------------------------------
  tripName: { label: "Trip name", value: null },
  tripDestination: { label: "Destination", value: null },
  departureDate: { label: "Departure date", value: null },
  returnDate: { label: "Return date", value: null },
  tripDuration: { label: "Duration", value: null },
  meetingPoint: { label: "Meeting point", value: null },
  meetingTime: { label: "Meeting time", value: null },
  departureTime: { label: "Departure time", value: null },
  departurePoint: { label: "Departure point", value: null },
  returnPoint: { label: "Return point", value: null },

  // --- money -------------------------------------------------------------
  pricePerSeat: { label: "Price per seat", value: null, note: "EGP, tabular" },
  depositAmount: {
    label: "Deposit",
    value: null,
    note: "Terms PDF 3.1 states 50% of booking value — confirm before showing",
  },

  // --- stay & transport --------------------------------------------------
  hotelOrCamp: { label: "Hotel / camp", value: null },
  roomType: { label: "Room type", value: null },
  roomOccupancy: { label: "Room occupancy", value: null },
  numberOfNights: { label: "Number of nights", value: null },
  transportation: { label: "Transportation", value: null },

  // --- booking -----------------------------------------------------------
  bookingReference: {
    label: "Booking reference",
    value: null,
    note: "Format PI-YYYY-##### — the PDF's PI-2026-00125 is a sample, not real",
  },
  availability: {
    label: "Availability",
    value: null,
    note: "Must be one of the four locked states in content/cta.ts",
  },
  seatsTaken: {
    label: "Seats already booked",
    value: null,
    note: "Seats 4 and 9 in the current preview are illustrative only",
  },
} as const satisfies Record<string, PlaceholderEntry>;

export type PlaceholderId = keyof typeof PLACEHOLDERS;

/** The real value if it exists, otherwise null. */
export function placeholderValue(id: PlaceholderId): string | null {
  return PLACEHOLDERS[id].value;
}

/** Every id still waiting on real information. */
export function outstandingPlaceholders(): PlaceholderId[] {
  return (Object.keys(PLACEHOLDERS) as PlaceholderId[]).filter(
    (id) => PLACEHOLDERS[id].value === null
  );
}
