import type { Trip, TripOptionGroup } from "./trips";

export const SOCOTRA_GALLERY = [
 {src:"/socotra/dunes-at-dusk.jpeg",alt:"White sand dunes beside the turquoise sea at dusk"},
 {src:"/socotra/white-dunes-and-sea.jpeg",alt:"Travelers walking on white dunes above the sea"},
 {src:"/socotra/dragon-blood-forest.jpeg",alt:"A traveler looking over the dragon blood tree forest"},
 {src:"/socotra/kalisan-canyon.jpeg",alt:"Kalisan Canyon, credited to Kristina Makeeva in the supplied filename"},
 {src:"/socotra/flowers-and-dragon-trees.jpeg",alt:"Pink flowers framing dragon blood trees"},
 {src:"/socotra/desert-rose-night.jpeg",alt:"Desert rose trees beneath a star-filled sky"},
 {src:"/socotra/island-moments.jpeg",alt:"Supplied collage of dunes, dragon blood trees and the night sky"},
 {src:"/socotra/camp-at-sunset.jpeg",alt:"Supplied collage of camping among dragon blood trees at sunset"},
 {src:"/socotra/desert-rose-portrait.jpeg",alt:"Portrait among flowering desert rose trees"},
];

export const SOCOTRA_DEPARTURES: TripOptionGroup = {
  id: "departure", kind: "date", label: "Choose your departure", required: true,
  hint: "8 days / 7 nights. Proposed dates, subject to flight and availability confirmation.",
  choices: [
    { id: "2026-11-26", label: "26 November – 3 December 2026", detail: "8 days / 7 nights · proposed departure" },
    { id: "2027-01-07", label: "7 – 14 January 2027", detail: "8 days / 7 nights · proposed departure" },
    { id: "2027-03-11", label: "11 – 18 March 2027", detail: "8 days / 7 nights · proposed departure" },
  ],
};
// Controlled by Planet Infinity, not by the traveler. No deadline/allocation
// has been supplied yet; this local preview displays the Early Bird rate.
export const SOCOTRA_ACTIVE_RATE: "early" | "regular" = "early";
export const SOCOTRA_RATE = { early:{amount:2190,label:"Early Bird"}, regular:{amount:2290,label:"Regular"} };
export const SOCOTRA_CONNECTION: TripOptionGroup = {
  id: "connection", kind: "option", label: "Getting to Jeddah", required: true,
  hint: "We meet in Jeddah, Saudi Arabia, and fly together to Socotra. Your flight to Jeddah is arranged separately.",
  choices: [
    { id: "help", label: "Help me get to the meeting point", detail: "Ask our team for flight options to Jeddah and a separate quote." },
    { id: "own", label: "I will arrange my flight to Jeddah", detail: "Wait for our confirmed group flight schedule before buying your ticket." },
  ],
};
export const SOCOTRA_DAYS = [
  ["Qalansiyah & Detwah Lagoon", "Meet your guide at Socotra Airport and drive towards Qalansiyah, stopping at the old Russian tanks. Walk from the Detwah viewpoint to the lagoon, enjoy beach time and lunch at camp, then visit a sunset viewpoint. Overnight at Detwah Lagoon."],
  ["Shuab Beach & Detwah", "Boat trip to Shuab Beach with a swimming and snorkeling stop as conditions permit. Dolphins and seabirds may be seen along the way. Return to Detwah for lunch, then visit Abdullah at his cave. Overnight at Detwah Lagoon."],
  ["Dixam, Wadi Dirhur & Firmhin Forest", "Explore Dixam Plateau, the dragon blood trees and viewpoints over Wadi Dirhur. Descend into the canyon for lunch and free time, then continue to Firmhin Forest for an overnight camp."],
  ["Degub Cave, Omak Beach & Zahaq Dunes", "A short walk to Degub Cave, lunch by the sea at Omak Beach, and an afternoon visit to Zahaq sand dunes for sunset. Overnight at Omak Beach."],
  ["Wadi Kalasan & Arher Beach", "Approximately a 30-minute descent to Wadi Kalasan's natural pool, followed by a picnic at the top. Continue to Arher Beach for swimming, relaxing and photography. Dinner and overnight at Arher Beach."],
  ["Homhil & Ras Ersal", "A pre-dawn dune walk at Arher, followed by a drive to Homhil and an approximately 30-minute walk to its natural pool. Visit Ras Ersal in the afternoon and return to Arher camp."],
  ["Dihamri & Delisha", "Lunch in a shady wadi, followed by Dihamri Marine Protected Area and Delisha Beach. Snorkeling and diving equipment can be rented at Dihamri; rental costs require separate confirmation. Dinner and overnight by Delisha Beach."],
  ["Hadibo & departure", "Morning shopping in Hadibo and a visit to the fish market, depending on flight timing. Transfer to Socotra Airport for the return flight to Jeddah."],
] as const;
export function socotraEstimate(count: string, rate: string = SOCOTRA_ACTIVE_RATE) {
  const guests = Number(count);
  if (!Number.isInteger(guests) || guests < 1 || guests > 80 || !["early", "regular"].includes(rate)) return undefined;
  return guests * (rate === "early" ? 2190 : 2290);
}
export function normalizeSocotraPhone(value:string) {
  const cleaned=value.trim().replace(/[\s().-]/g, "").replace(/^00/, "+");
  return /^\+[1-9]\d{6,14}$/.test(cleaned) ? cleaned : "";
}

export const SOCOTRA_TRIP: Trip = {
 id:"socotra-8-days",slug:"socotra",title:"Socotra",destination:"Socotra, Yemen",
 shortDescription:"Eight days of white dunes, turquoise lagoons and dragon blood forests. Meet the group in Jeddah; island flights, the ground program and Socotra visa are included, subject to confirmation.",
 description:["An eight-day camping journey following the supplied Socotra program."],
 duration:"8 days / 7 nights · Nov 2026, Jan & Mar 2027 (proposed)",
 currency:"USD",priceUsd:SOCOTRA_RATE[SOCOTRA_ACTIVE_RATE].amount,priceUnit:`per person · ${SOCOTRA_RATE[SOCOTRA_ACTIVE_RATE].label} estimate`,
 featured:true,bookingMode:"request",tripSelectionEnabled:true,seatBookingEnabled:false,paymentProofRequired:false,
 media:{hero:"/socotra/white-dunes-and-sea.jpeg",heroAlt:"White dunes and turquoise sea in Socotra",gallery:SOCOTRA_GALLERY,visualTheme:{primaryColor:"#73cfe4",secondaryColor:"#eee8db",surface:"light",typography:"brand",channels:["trips"]}},
 document:{url:"/documents/Socotra%20Trip%20Program.pdf",label:"Socotra Trip Program · 8 days"},
 optionGroups:[SOCOTRA_DEPARTURES],ctaLabelOverride:"Request Booking",ctaHelper:"No payment is collected. Dates, flights, visas and availability are confirmed by our team.",
};
