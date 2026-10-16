import type { PlanetEvent } from "./types";

export const HALLOWEEN_SLUG = "halloween-party-2026";
export const HALLOWEEN_POLICY_VERSION = "events-2026-10-17";
export const HALLOWEEN_TERMS = [
  "Men: 21+. Women: 18+.",
  "Mixed groups, couples, or women-only groups.",
  "Entry by electronic ticket only. Bring your original, valid physical ID.",
  "Costume is a must.",
  "Door selection applies. A confirmed reservation does not guarantee entry.",
  "Tickets are non-refundable and non-transferable, including if entry is refused through selection, subject to applicable law.",
  "Follow all security instructions and venue rules. Respect guests, artists and staff.",
  "The exact location will be sent to confirmed guests one day before the event.",
] as const;

export const HALLOWEEN_EVENT: PlanetEvent = {
  id: "9f1a1030-2026-4030-8030-000000000001",
  slug: HALLOWEEN_SLUG,
  title: "Halloween Party",
  category: "Halloween · After dark",
  shortDescription: "One night. Another world. Step into the unexpected with Planet Infinity.",
  description: ["Your alter ego has an invitation. A night of DJ sets, live acts and surprise moments, wrapped in a world that only comes alive after dark.", "Gather your people. Find your costume. Leave room for the unexpected."],
  venue: "Cairo · Secret location",
  eventDate: "Friday 30 October 2026",
  startTime: "7 PM",
  endTime: "2 AM",
  currency: "EGP",
  priceEgp: 1000,
  bookingFeeEgp: 35,
  ticketLabel: "Early Bird · Very limited",
  priceUnit: "per person",
  bookingMode: "booking",
  applicationRequired: false,
  ticketSelectionEnabled: false,
  quantityEnabled: true,
  minQuantity: 1,
  featured: true,
  media: { hero: "/halloween/poster.png", heroAlt: "Planet Infinity Halloween party poster — 30 October, Cairo", visualTheme: { primaryColor: "#ed813e", secondaryColor: "#9c86b8", surface: "light", finish: "matte", background: "clean", depth: "flat", channels: ["events"] } },
  whatIsIncluded: ["DJ sets", "Live acts", "Surprise moments"],
  importantInformation: [...HALLOWEEN_TERMS],
  cancellationSummary: "Tickets are non-refundable and non-transferable. Door selection applies, and a confirmed reservation does not guarantee admission. Subject to applicable law.",
};

export const EVENT_PAYMENT_SECTIONS = [
  { title: "01 / Full payment", text: "Pay 100% of the ticket total shown at checkout. Events do not use trip deposits, instalments or trip balance deadlines. All mandatory fees must be shown before payment." },
  { title: "02 / Choose your payment method", text: "Pay through Planet Infinity's Paymob checkout, or transfer through the official InstaPay / Vodafone Cash details displayed in your booking. Manual transfers require a receipt and verification that the funds have arrived. Uploading a receipt alone does not verify payment." },
  { title: "03 / Payment and confirmation", text: "A booking reference or payment receipt is not an entry ticket. Final confirmation is issued only after the full payment has been verified and the booking reviewed by Planet Infinity. Admission remains subject to door selection and event requirements." },
  { title: "04 / Non-refundable tickets", text: "Tickets are non-refundable and non-transferable. This includes a change of plans, failure to attend, or refusal through selection. This condition does not limit any rights or refunds required by applicable law." },
  { title: "05 / Your location reveal", text: "The exact location and arrival instructions will be sent to confirmed guests one day before the event. Use accurate contact details and contact Planet Infinity if your arrival details have not reached you before travelling." },
  { title: "06 / Event changes", text: "If the event is cancelled or rescheduled, Planet Infinity will contact affected guests with the arrangements and any remedies required by applicable law. Event-specific terms apply to event bookings; trip policies continue to apply to trips." },
] as const;
