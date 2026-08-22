/**
 * ARCHITECTURE TEST CASES — NOT REAL PLANET INFINITY EVENTS.
 *
 * Four configurations proving that ticket selection, quantity and booking
 * mode are independent of one another:
 *
 *   A  simple booking          tickets off · quantity off
 *   B  ticket selection        tickets on  · quantity off
 *   C  tickets + quantity      tickets on  · quantity on
 *   D  request / application   application mode
 *
 * These carry NO price, NO date, NO time, NO venue and NO capacity. Nothing
 * operational is invented: every unknown renders through the placeholder
 * system, exactly as it will for a real event whose details are not set yet.
 * Ticket options are neutral labels, not invented Planet Infinity tiers.
 *
 * Real events go in ./index.ts, which is empty until Adam supplies them.
 */
import type { PlanetEvent } from "./types";

const DEMO_INCLUDED = ["Entry to the event", "Event crew on site"];

const DEMO_NOT_INCLUDED = [
  "Transport to and from the venue",
  "Anything not listed in the event details",
];

const DEMO_IMPORTANT = [
  "Bring ID. Entry conditions are set per event and confirmed before the date.",
  "Arrive within the stated entry window — late entry is not guaranteed.",
];

const DEMO_CANCELLATION =
  "Cancellation terms are set per event and shared in writing before any payment is taken. Requests must be sent through an official Planet Infinity channel.";

const DEMO_FAQ: PlanetEvent["faq"] = [
  {
    question: "Is my place confirmed as soon as I send this?",
    answer:
      "No. Nothing is confirmed until we come back to you in writing. This preview does not send, save or charge anything.",
  },
  {
    question: "Can I bring someone with me?",
    answer:
      "It depends on the event. Where extra places are possible, the quantity step will let you choose how many.",
  },
];

function demoBase(): Pick<
  PlanetEvent,
  | "currency"
  | "priceUnit"
  | "media"
  | "whatIsIncluded"
  | "whatIsNotIncluded"
  | "importantInformation"
  | "cancellationSummary"
  | "faq"
  | "isDemo"
> {
  return {
    currency: "EGP",
    priceUnit: "per ticket",
    media: {},
    whatIsIncluded: DEMO_INCLUDED,
    whatIsNotIncluded: DEMO_NOT_INCLUDED,
    importantInformation: DEMO_IMPORTANT,
    cancellationSummary: DEMO_CANCELLATION,
    faq: DEMO_FAQ,
    isDemo: true,
  };
}

export const DEMO_EVENTS: PlanetEvent[] = [
  {
    ...demoBase(),
    id: "demo-event-a",
    slug: "demo-event-a-simple",
    title: "Demo Event A — simple booking",
    shortDescription:
      "Test case: no ticket selection, no quantity. Straight to guest details.",
    description: [
      "This is an architecture test case, not a real event. It proves the simplest path: a guest reads the event and books, with no ticket step and no quantity step anywhere in the flow.",
    ],
    category: "Demo category",
    availability: "available",
    bookingMode: "booking",
    ticketSelectionEnabled: false,
    quantityEnabled: false,
  },
  {
    ...demoBase(),
    id: "demo-event-b",
    slug: "demo-event-b-tickets",
    title: "Demo Event B — ticket selection",
    shortDescription:
      "Test case: ticket selection enabled, no quantity step.",
    description: [
      "This is an architecture test case, not a real event. It proves that an event can offer a ticket choice without a quantity step — one place, one ticket.",
    ],
    category: "Demo category",
    availability: "fewSpotsLeft",
    bookingMode: "booking",
    ticketType: "tiered",
    ticketSelectionEnabled: true,
    quantityEnabled: false,
    ticketOptions: [
      { id: "t1", label: "Ticket option 1", detail: "Price not set" },
      { id: "t2", label: "Ticket option 2", detail: "Price not set" },
      { id: "t3", label: "Ticket option 3", detail: "Price not set", soldOut: true },
    ],
  },
  {
    ...demoBase(),
    id: "demo-event-c",
    slug: "demo-event-c-tickets-quantity",
    title: "Demo Event C — tickets and quantity",
    shortDescription:
      "Test case: ticket selection plus a quantity step, with per-option limits.",
    description: [
      "This is an architecture test case, not a real event. It proves the two capabilities compose: the guest picks a ticket, then how many, and both carry through to review.",
    ],
    category: "Demo category",
    availability: "almostFull",
    bookingMode: "booking",
    ticketType: "tiered",
    ticketSelectionEnabled: true,
    quantityEnabled: true,
    minQuantity: 1,
    maxQuantity: 6,
    ticketOptions: [
      {
        id: "t1",
        label: "Ticket option 1",
        detail: "Price not set",
        minQuantity: 1,
        maxQuantity: 4,
        availableQuantity: 4,
      },
      {
        id: "t2",
        label: "Ticket option 2",
        detail: "Price not set · limited",
        minQuantity: 2,
        maxQuantity: 2,
        availableQuantity: 2,
      },
    ],
  },
  {
    ...demoBase(),
    id: "demo-event-d",
    slug: "demo-event-d-request",
    title: "Demo Event D — request to attend",
    shortDescription:
      "Test case: private or curated. The guest applies and we approve the list.",
    description: [
      "This is an architecture test case, not a real event. It proves the application path: no ticket step, no quantity step, no checkout — the guest sends a request and we decide.",
    ],
    category: "Demo category",
    availability: "available",
    bookingMode: "application",
    ticketSelectionEnabled: false,
    quantityEnabled: false,
  },
];
