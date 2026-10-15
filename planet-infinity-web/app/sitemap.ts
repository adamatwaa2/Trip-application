import type { MetadataRoute } from "next";
import { getEvents, getTrips } from "@/content/source";
import { POLICY_PAGES } from "@/content/policies";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://planetinfinity.online";
  const [trips, events] = await Promise.all([getTrips(), getEvents()]);
  const staticPaths = ["", "/trips", "/events", "/themes", "/explore", "/contact", "/join", "/policies", ...POLICY_PAGES.map(({ slug }) => `/policies/${slug}`)];
  return [
    ...staticPaths.map((path, index) => ({ url: `${base}${path || "/"}`, changeFrequency: index === 0 ? "weekly" as const : "monthly" as const, priority: index === 0 ? 1 : 0.7 })),
    ...trips.map((trip) => ({ url: `${base}/trips/${trip.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...events.filter((event) => !event.media.linkedTripSlug).map((event) => ({ url: `${base}/events/${event.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
