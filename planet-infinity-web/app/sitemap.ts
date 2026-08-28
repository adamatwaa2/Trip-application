import type { MetadataRoute } from "next";
import { getEvents, getTrips } from "@/content/source";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://planetinfinity.online";
  const [trips, events] = await Promise.all([getTrips(), getEvents()]);
  const staticPaths = ["", "/trips", "/events", "/explore", "/contact", "/policies"];
  return [
    ...staticPaths.map((path, index) => ({ url: `${base}${path || "/"}`, changeFrequency: index === 0 ? "weekly" as const : "monthly" as const, priority: index === 0 ? 1 : 0.7 })),
    ...trips.map((trip) => ({ url: `${base}/trips/${trip.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...events.map((event) => ({ url: `${base}/events/${event.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
