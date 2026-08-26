export const SITE_COPY_FIELDS = [
  { key: "home_eyebrow", label: "Home eyebrow", fallback: "Available now", multiline: false },
  { key: "home_title", label: "Home headline", fallback: "Your next world starts here.", multiline: false },
  { key: "home_lede", label: "Home introduction", fallback: "Book the trips and experiences that are open now, or step into the events world.", multiline: true },
  { key: "home_trips_title", label: "Home trips heading", fallback: "Trips you can join", multiline: false },
  { key: "home_trips_lede", label: "Home trips introduction", fallback: "Real departures, clear details and a booking path that matches each trip.", multiline: true },
  { key: "home_events_title", label: "Home events heading", fallback: "Events worth showing up for", multiline: false },
  { key: "home_events_lede", label: "Home events introduction", fallback: "Daytime gatherings, creative sessions and nights with their own energy.", multiline: true },
  { key: "events_title", label: "Events page headline", fallback: "Events with a world of their own", multiline: false },
  { key: "events_lede", label: "Events page introduction", fallback: "From daytime gatherings to after-dark experiences, every event is announced only when its details are ready.", multiline: true },
  { key: "explore_title", label: "Explore page headline", fallback: "One planet. More than one world.", multiline: false },
  { key: "explore_lede", label: "Explore page introduction", fallback: "Move between travel and events as the Planet Infinity universe changes around you.", multiline: true },
  { key: "footer_tagline", label: "Footer tagline", fallback: "Travel, experiences and events.\nOne brand, more than one world.", multiline: true },
] as const;

export type SiteCopyKey = (typeof SITE_COPY_FIELDS)[number]["key"];
export type SiteCopy = Record<SiteCopyKey, string>;

export const SITE_COPY_DEFAULTS = Object.fromEntries(
  SITE_COPY_FIELDS.map((field) => [field.key, field.fallback]),
) as SiteCopy;

