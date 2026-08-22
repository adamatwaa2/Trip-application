/**
 * ARCHITECTURE TEST CASES — NOT REAL PLANET INFINITY TRIPS.
 *
 * These four trips exist to prove that trip selection and seat booking are
 * genuinely independent. Every one is marked `isDemo: true`, renders with a
 * DEMO badge, and is listed only when there are no real trips.
 *
 * These carry NO price, NO date and NO duration. Nothing operational is invented here:
 * price, dates, meeting point and departure time all render through the
 * placeholder system, exactly as they will for a real trip whose details are
 * not set yet. Real trips go in ./index.ts, which is empty until Adam
 * supplies them.
 *
 *   A  selection off · seats off
 *   B  selection on  · seats off
 *   C  selection off · seats on   (rare)
 *   D  selection on  · seats on   (rare)
 */
import { HIACE_14 } from "./seatLayouts";
import type { Trip } from "./types";

const DEMO_INCLUDED = [
  "Transportation",
  "Accommodation",
  "Meals as listed in the itinerary",
  "Activities included in the itinerary",
  "Tour leader",
];

const DEMO_NOT_INCLUDED = [
  "Personal expenses",
  "Anything not listed in this confirmation or the approved itinerary",
];

const DEMO_IMPORTANT = [
  "Please arrive at the meeting point at least 15 minutes before the scheduled departure time.",
  "Your package includes only the services listed in the booking confirmation and the approved itinerary.",
  "Keep your booking confirmation on your phone, and bring ID or passport if required.",
];

const DEMO_CANCELLATION =
  "Cancellation requests must be sent in writing through an official Planet Infinity channel. The date the request is received determines which refund terms apply. Final percentages and deadlines are set per trip and shared before payment.";

const DEMO_FAQ = [
  {
    question: "Is my booking confirmed as soon as I send the request?",
    answer:
      "No. A request starts the process. The booking is confirmed once the required payment is received and a written Booking Confirmation has been issued.",
  },
  {
    question: "What happens if I am late to the meeting point?",
    answer:
      "Group trips run on a shared schedule and the bus cannot wait in a way that disrupts the programme. If you miss it, getting to the group is at your own arrangement and cost.",
  },
];

function demoBase(n: number): Pick<
  Trip,
  | "currency"
  | "priceUnit"
  | "included"
  | "notIncluded"
  | "importantInformation"
  | "cancellationSummary"
  | "faq"
  | "itinerary"
  | "isDemo"
  | "media"
> {
  return {
    currency: "EGP",
    priceUnit: "per person",
    included: DEMO_INCLUDED,
    notIncluded: DEMO_NOT_INCLUDED,
    importantInformation: DEMO_IMPORTANT,
    cancellationSummary: DEMO_CANCELLATION,
    faq: DEMO_FAQ,
    media: {},
    isDemo: true,
    itinerary: [
      {
        label: "Day 1",
        title: "Departure and arrival",
        body: `Demo itinerary content for test case ${n}. Real itineraries are written per trip and are never generated.`,
      },
      {
        label: "Day 2",
        title: "The main day",
        body: "Demo itinerary content. Replaced entirely by real trip content.",
      },
    ],
  };
}

export const DEMO_TRIPS: Trip[] = [
  {
    ...demoBase(1),
    id: "demo-a",
    slug: "demo-a-standard",
    title: "Demo A — standard trip",
    shortDescription:
      "Test case: no trip selection, no seat booking. The normal Planet Infinity trip.",
    description: [
      "This is an architecture test case, not a real trip. It proves the default path: a guest reads the trip and sends a booking request, with no selection step and no seat map anywhere in the flow.",
      "Most Planet Infinity trips behave exactly like this one.",
    ],
    destination: "Demo destination",
    availability: "available",
    bookingMode: "request",
    tripSelectionEnabled: false,
    seatBookingEnabled: false,
  },
  {
    ...demoBase(2),
    id: "demo-b",
    slug: "demo-b-selection",
    title: "Demo B — trip selection",
    shortDescription:
      "Test case: trip selection enabled, no seat booking. Choose a date and a package.",
    description: [
      "This is an architecture test case, not a real trip. It proves that a trip can offer a selection step — a date, a package, an edition — without any seat map being involved.",
    ],
    destination: "Demo destination",
    availability: "fewSpotsLeft",
    bookingMode: "request",
    tripSelectionEnabled: true,
    seatBookingEnabled: false,
    optionGroups: [
      {
        id: "date",
        kind: "date",
        label: "Choose a departure",
        hint: "Departure dates are not set. These unlabelled options exist only to exercise the selection step.",
        required: true,
        choices: [
          { id: "d1", label: "Departure option 1", detail: "Date not set" },
          { id: "d2", label: "Departure option 2", detail: "Date not set" },
          {
            id: "d3",
            label: "Departure option 3",
            detail: "Date not set",
            soldOut: true,
          },
        ],
      },
      {
        id: "package",
        kind: "package",
        label: "Choose a package",
        required: true,
        choices: [
          { id: "standard", label: "Standard", detail: "Shared room" },
          { id: "premium", label: "Premium", detail: "Private room" },
        ],
      },
    ],
  },
  {
    ...demoBase(3),
    id: "demo-c",
    slug: "demo-c-seats",
    title: "Demo C — seat booking",
    shortDescription:
      "Test case: seat booking enabled, no trip selection. Rare — most trips do not do this.",
    description: [
      "This is an architecture test case, not a real trip. It proves the rare path where a guest picks a specific seat in the van without any package or date selection step.",
      "Seat booking is the exception, not the rule.",
    ],
    destination: "Demo destination",
    availability: "almostFull",
    bookingMode: "booking",
    tripSelectionEnabled: false,
    seatBookingEnabled: true,
    seat: {
      layout: HIACE_14,
      taken: [4, 9],
      unavailable: [],
    },
  },
  {
    ...demoBase(4),
    id: "demo-d",
    slug: "demo-d-selection-seats",
    title: "Demo D — selection and seats",
    shortDescription:
      "Test case: both enabled. Selection comes first, then the seat map.",
    description: [
      "This is an architecture test case, not a real trip. It proves the two capabilities compose: the guest chooses an option, then chooses a seat, and both carry through to the review step.",
    ],
    destination: "Demo destination",
    availability: "available",
    bookingMode: "booking",
    tripSelectionEnabled: true,
    seatBookingEnabled: true,
    optionGroups: [
      {
        id: "edition",
        kind: "edition",
        label: "Choose an edition",
        required: true,
        choices: [
          { id: "sunrise", label: "Sunrise run" },
          { id: "sunset", label: "Sunset run" },
        ],
      },
    ],
    seat: {
      layout: HIACE_14,
      taken: [4, 9],
      unavailable: [14],
    },
  },
];
