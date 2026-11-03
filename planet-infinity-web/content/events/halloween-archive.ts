import { HALLOWEEN_EVENT } from "@/content/events/halloween";
import type { PlanetEvent } from "@/content/events";

// Approved public archive cards for these two past editions.
export const HALLOWEEN_ARCHIVE: PlanetEvent[] = [
  {
    ...HALLOWEEN_EVENT,
    shortDescription: "A Halloween night of costumes, DJ sets and live acts.",
    venue: "New Cairo",
  },
  {
    ...HALLOWEEN_EVENT,
    id: "spooky-haus-archive",
    slug: "spooky-haus",
    title: "Spooky Haus",
    category: "Halloween Dinner Party",
    shortDescription: "A Halloween dinner party by Planet Infinity × CUCA Club.",
    venue: undefined,
    media: {
      hero: "https://dnjeghmqieyqgafwuemj.supabase.co/storage/v1/object/public/catalog-media/615119c8-d40a-450b-8286-ada8f9f4dc88/image/2026-10/4990dc5a-26ea-4dd1-90e7-1d9b517601bd.png",
      heroAlt: "Spooky Haus event artwork",
    },
  },
];
