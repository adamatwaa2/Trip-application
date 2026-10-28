import type { CatalogChannel, CatalogVisualTheme } from "@/lib/catalog-visual-theme";
export type UpcomingWorld = { slug:string; title:string; subtitle:string; kind:"trip"|"event"; channels:CatalogChannel[]; location:string; window:string; motif:string; accent:string; surface:string; ink:string; tagline:string; description:string; mood:string[]; theme?:CatalogVisualTheme; hero?:string; video?:string; logo?:string };
/** Public concept previews only. The operational Admin records stay unpublished until reviewed.
 * Published catalogue rows take precedence over these previews. No booking data is invented. */
export const UPCOMING_WORLDS: UpcomingWorld[] = [
  {
    "slug": "arena",
    "title": "ARENA",
    "subtitle": "Hunger Games-inspired island reality competition",
    "kind": "event",
    "channels": [
      "events",
      "themes"
    ],
    "location": "Location to be announced",
    "window": "Dates to be announced",
    "motif": "arena",
    "accent": "#d6b45d",
    "surface": "#173a34",
    "ink": "#fdf8f1",
    "tagline": "Enter as strangers. Leave as one winner.",
    "description": "A proposed annual island reality competition in Egypt, with an international adult cast, alliances, supervised challenges and one winner. A three-day first edition and a larger 4–5 day edition are in development. Cast, venue, prize and broadcast details are not confirmed.",
    "mood": [
      "Team spirit",
      "Strategy",
      "Shared challenges"
    ]
  },
  {
    "slug": "dune-siwa",
    "title": "DUNE",
    "subtitle": "White Desert · Black Desert · Siwa",
    "kind": "trip",
    "channels": [
      "trips",
      "themes"
    ],
    "location": "Western Desert, Egypt · Proposed route",
    "window": "December 2026",
    "motif": "dunes",
    "accent": "#dc5e15",
    "surface": "#eee0c9",
    "ink": "#3e2c1b",
    "tagline": "A different rhythm, beyond the dunes.",
    "description": "A proposed 7-day / 6-night journey through the White Desert, Black Desert and Siwa. Two camping nights, one transfer and rest overnight, and three nights in Siwa; the route, stays and program are still being prepared.",
    "mood": [
      "Oasis atmosphere",
      "Desert textures",
      "Slower days"
    ]
  },
  {
    "slug": "doomsday",
    "title": "ASSEMBLE",
    "subtitle": "Avengers: Doomsday-inspired experience",
    "kind": "event",
    "channels": [
      "events",
      "themes"
    ],
    "location": "Location to be announced",
    "window": "December 2026",
    "motif": "doom",
    "accent": "#c4554d",
    "surface": "#101722",
    "ink": "#e3e8ed",
    "tagline": "Before Doomsday, we assemble.",
    "description": "Inspired by the world of Avengers: Doomsday. A costume-led community concept with cinematic atmosphere, music and the spirit of assembling a new team. The final format and event details are still being developed.",
    "mood": [
      "Cinematic energy",
      "A shared mission",
      "A world coming together"
    ]
  },
  {
    "slug": "zero-hour",
    "title": "ZERO HOUR",
    "subtitle": "New Year’s Eve",
    "kind": "event",
    "channels": [
      "events"
    ],
    "location": "Location to be announced",
    "window": "December 2026",
    "motif": "clock",
    "accent": "#e7c174",
    "surface": "#0f1e28",
    "ink": "#fdf8f1",
    "tagline": "One countdown. A new beginning.",
    "description": "Our New Year’s Eve concept: a night designed around coming together and crossing into a new year. Full details are still to come.",
    "mood": [
      "The countdown",
      "Your people",
      "A fresh beginning"
    ]
  },
  {
    "slug": "white-desert",
    "title": "WHITE",
    "subtitle": "The White Desert",
    "kind": "trip",
    "channels": [
      "trips"
    ],
    "location": "White Desert, Egypt",
    "window": "January 2027",
    "motif": "dunes",
    "accent": "#bca378",
    "surface": "#f5f0e6",
    "ink": "#0f1e28",
    "tagline": "Less noise. More wonder.",
    "description": "A White Desert journey with an identity shaped by chalk-white landscapes, open horizons and the feeling of being far from the everyday.",
    "mood": [
      "White landscapes",
      "Open horizons",
      "Quiet wonder"
    ]
  },
  {
    "slug": "school-hunt-dahab",
    "title": "SENIORS HUNT",
    "subtitle": "Schools championship · Dahab",
    "kind": "trip",
    "channels": [
      "trips",
      "events",
      "themes"
    ],
    "location": "Dahab, Egypt",
    "window": "February 2027",
    "motif": "arena",
    "accent": "#f59b23",
    "surface": "#174f64",
    "ink": "#fdf8f1",
    "tagline": "Your school. Your team. Your story.",
    "description": "A Dahab-based schools championship concept, combining a trip with a team-led event. Age groups, school participation, supervision and the competition format will be confirmed before registration.",
    "mood": [
      "School spirit",
      "Team challenges",
      "Dahab setting"
    ]
  },
  {
    "slug": "kemet",
    "title": "KEMET",
    "subtitle": "Luxor & Aswan",
    "kind": "trip",
    "channels": [
      "trips"
    ],
    "location": "Luxor & Aswan, Egypt",
    "window": "Dates to be announced",
    "motif": "temple",
    "accent": "#c6a35c",
    "surface": "#193c48",
    "ink": "#fdf8f1",
    "tagline": "Follow the river. Find another Egypt.",
    "description": "A journey concept connecting Luxor and Aswan, with a visual world inspired by the Nile, stone, history and golden light.",
    "mood": [
      "Nile atmosphere",
      "History",
      "Luxor & Aswan"
    ]
  },
  {
    "slug": "el-quseir",
    "title": "EL QUSEIR",
    "subtitle": "Red Sea escape",
    "kind": "trip",
    "channels": [
      "trips"
    ],
    "location": "El Quseir, Egypt",
    "window": "Dates to be announced",
    "motif": "sea",
    "accent": "#e5b38d",
    "surface": "#285e65",
    "ink": "#fdf8f1",
    "tagline": "Take the quieter coast.",
    "description": "An El Quseir trip concept with a calm Red Sea identity: coastal colours, breathing room and a different pace.",
    "mood": [
      "Coastal calm",
      "Red Sea colours",
      "A slower escape"
    ]
  },
  {
    "slug": "nuweiba",
    "title": "NUWEIBA",
    "subtitle": "Sinai by the sea",
    "kind": "trip",
    "channels": [
      "trips"
    ],
    "location": "Nuweiba, Egypt",
    "window": "Dates to be announced",
    "motif": "sea",
    "accent": "#f2b69c",
    "surface": "#416e7b",
    "ink": "#fdf8f1",
    "tagline": "Mountains behind you. Sea ahead.",
    "description": "A Nuweiba escape concept inspired by the meeting of Sinai’s mountains and the sea. The program, stay and travel arrangements are still being prepared.",
    "mood": [
      "Sinai atmosphere",
      "Sea & mountains",
      "Room to unwind"
    ]
  },
  {
    "slug": "sharm-el-sheikh",
    "title": "SHARM EL SHEIKH",
    "subtitle": "A Red Sea getaway",
    "kind": "trip",
    "channels": [
      "trips"
    ],
    "location": "Sharm El Sheikh, Egypt",
    "window": "Dates to be announced",
    "motif": "sea",
    "accent": "#e6c777",
    "surface": "#123b66",
    "ink": "#fdf8f1",
    "tagline": "A little more blue. A little more escape.",
    "description": "A Sharm El Sheikh trip concept with a bright Red Sea identity. Dates, accommodation and the confirmed experience will be shared before bookings open.",
    "mood": [
      "Red Sea blue",
      "A shared getaway",
      "Time away"
    ]
  },
  {
    "slug": "hurghada",
    "title": "HURGHADA",
    "subtitle": "Red Sea days",
    "kind": "trip",
    "channels": [
      "trips"
    ],
    "location": "Hurghada, Egypt",
    "window": "Dates to be announced",
    "motif": "sea",
    "accent": "#f1ae8e",
    "surface": "#216b78",
    "ink": "#fdf8f1",
    "tagline": "Make room for sea days.",
    "description": "A Hurghada escape concept centred on a sunny coastal mood and community. The final program and package details are still being developed.",
    "mood": [
      "Coastal energy",
      "Sunlit days",
      "Good company"
    ]
  },
  {
    "slug": "masquerade-party",
    "title": "MASQUERADE",
    "subtitle": "Masquerade Party",
    "kind": "event",
    "channels": ["events", "themes"],
    "location": "Location to be announced",
    "window": "Dates to be announced",
    "motif": "mask",
    "accent": "#d9b76c",
    "surface": "#251b30",
    "ink": "#fff5e4",
    "tagline": "Behind the mask. Into the night.",
    "description": "A masked-party concept with a world of velvet tones, gold details and a little mystery. The venue, date, music and full experience are still being prepared.",
    "mood": ["Masks & mystery", "Velvet & gold", "A night to discover"]
  },
  {
    "slug": "pirates-red-sea",
    "title": "PIRATES",
    "subtitle": "Pirates of the Red Sea",
    "kind": "trip",
    "channels": [
      "trips",
      "themes"
    ],
    "location": "Red Sea, Egypt",
    "window": "April–May 2027",
    "motif": "sea",
    "accent": "#f59b23",
    "surface": "#0f1e28",
    "ink": "#fdf8f1",
    "tagline": "Leave the ordinary on shore.",
    "description": "A pirate-inspired Red Sea world, built around discovery, a shared story and the spirit of a crew.",
    "mood": [
      "Open water",
      "A crew of your own",
      "An unfolding story"
    ]
  }
];
export function upcomingHref(world:UpcomingWorld) { return world.slug==="doomsday"?"/events/assemble":`/${world.kind==="trip"?"trips":"events"}/${world.slug}`; }
export function findUpcomingWorld(slug:string, kind:"trip"|"event") { return UPCOMING_WORLDS.find(w=>w.slug===slug && w.kind===kind); }
export function upcomingFor(channel:CatalogChannel, publishedSlugs:string[]=[]) { const published=new Set(publishedSlugs);return UPCOMING_WORLDS.filter(w=>w.channels.includes(channel)&&!published.has(w.slug)); }


