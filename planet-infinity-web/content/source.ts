/**
 * Planet Infinity's public catalogue source.
 *
 * Supabase is the operational source whenever the new project is configured.
 * Local content remains a safe fallback while the database has no published
 * catalogue yet. The legacy Shopify files are not imported or executed.
 */
import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { EVENTS, FEATURED_EVENTS, allEvents, findEvent, type PlanetEvent } from "./events";
import { FEATURED_TRIPS, TRIPS, allTrips, findTrip, type Trip } from "./trips";

type DatabaseTrip = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  destination: string | null;
  duration_label: string | null;
  departure_at: string | null;
  meeting_point: string | null;
  return_at: string | null;
  departure_point: string | null;
  return_point: string | null;
  package_label: string | null;
  accommodation: string | null;
  transportation: string | null;
  important_information: string[];
  price_egp: number | null;
  capacity: number | null;
  booking_mode: Trip["bookingMode"];
  application_required: boolean;
  seat_selection_enabled: boolean;
  seat_config: Trip["seat"] | null;
  booking_form_fields: Trip["bookingFormFields"];
  payment_proof_required: boolean;
  document_url: string | null;
  document_label: string | null;
  is_featured: boolean;
  media: Trip["media"] | null;
  inclusions: string[];
  exclusions: string[];
  itinerary: Trip["itinerary"];
  options: Trip["optionGroups"];
};
type DatabaseEvent = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  category: string | null;
  venue: string | null;
  starts_at: string | null;
  ends_at: string | null;
  price_egp: number | null;
  capacity: number | null;
  booking_mode: PlanetEvent["bookingMode"];
  application_required: boolean;
  document_url: string | null;
  document_label: string | null;
  important_information: string[];
  is_featured: boolean;
  media: PlanetEvent["media"] | null;
  ticket_options: PlanetEvent["ticketOptions"];
  inclusions: string[];
  exclusions: string[];
};

function dateParts(value: string | null) {
  if (!value) return {};
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return {};
  return { date: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date), time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date) };
}
function mapTrip(row: DatabaseTrip): Trip {
  const departure = dateParts(row.departure_at);
  const returning = dateParts(row.return_at);
  return { id: row.id, slug: row.slug, title: row.title, shortDescription: row.short_description, description: row.description ? row.description.split("\n").filter(Boolean) : [], destination: row.destination ?? "Trip", duration: row.duration_label ?? undefined, meetingPoint: row.meeting_point ?? undefined, departureTime: departure.time, returnTime: returning.time, departurePoint: row.departure_point ?? undefined, returnPoint: row.return_point ?? undefined, packageLabel: row.package_label ?? undefined, accommodation: row.accommodation ?? undefined, transportation: row.transportation ?? undefined, priceEgp: row.price_egp ?? undefined, currency: "EGP", featured: row.is_featured, bookingMode: row.booking_mode, applicationRequired: row.application_required, tripSelectionEnabled: Array.isArray(row.options) && row.options.length > 0, seatBookingEnabled: row.seat_selection_enabled, optionGroups: row.options, seat: row.seat_selection_enabled && row.seat_config?.layout ? row.seat_config : undefined, bookingFormFields: row.booking_form_fields ?? [], paymentProofRequired: row.payment_proof_required, document: row.document_url ? { url: row.document_url, label: row.document_label ?? "Trip information PDF" } : undefined, media: row.media ?? {}, included: row.inclusions, notIncluded: row.exclusions, itinerary: row.itinerary, importantInformation: row.important_information };
}
function mapEvent(row: DatabaseEvent): PlanetEvent {
  const starts = dateParts(row.starts_at); const ends = dateParts(row.ends_at);
  return { id: row.id, slug: row.slug, title: row.title, shortDescription: row.short_description, description: row.description ? row.description.split("\n").filter(Boolean) : [], category: row.category ?? "Event", venue: row.venue ?? undefined, eventDate: starts.date, startTime: starts.time, endTime: ends.time, priceEgp: row.price_egp ?? undefined, currency: "EGP", capacity: row.capacity ?? undefined, featured: row.is_featured, bookingMode: row.booking_mode, applicationRequired: row.application_required, ticketSelectionEnabled: Array.isArray(row.ticket_options) && row.ticket_options.length > 0, quantityEnabled: false, ticketOptions: row.ticket_options, document: row.document_url ? { url: row.document_url, label: row.document_label ?? "Event information PDF" } : undefined, media: row.media ?? {}, whatIsIncluded: row.inclusions, whatIsNotIncluded: row.exclusions, importantInformation: row.important_information };
}

async function databaseTrips(): Promise<Trip[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("trips").select("id, slug, title, short_description, description, destination, duration_label, departure_at, return_at, meeting_point, departure_point, return_point, package_label, accommodation, transportation, important_information, price_egp, capacity, booking_mode, application_required, seat_selection_enabled, seat_config, booking_form_fields, payment_proof_required, document_url, document_label, is_featured, media, inclusions, exclusions, itinerary, options").eq("is_published", true).order("departure_at", { ascending: true, nullsFirst: false });
  // An empty operational catalogue is not a valid replacement for the
  // local fallback. This keeps the public site usable immediately after the
  // database schema is created, before the team publishes its first trip.
  if (error || !data?.length) return null;
  return (data as unknown as DatabaseTrip[]).map(mapTrip);
}
async function databaseEvents(): Promise<PlanetEvent[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("id, slug, title, short_description, description, category, venue, starts_at, ends_at, important_information, price_egp, capacity, booking_mode, application_required, document_url, document_label, is_featured, media, ticket_options, inclusions, exclusions").eq("is_published", true).order("starts_at", { ascending: true, nullsFirst: false });
  // See databaseTrips: an empty table must not blank out the public listing.
  if (error || !data?.length) return null;
  return (data as unknown as DatabaseEvent[]).map(mapEvent);
}

export function dataSource(): "local" | "supabase" { return isSupabaseConfigured() ? "supabase" : "local"; }
export async function getTrips(): Promise<Trip[]> { return (await databaseTrips()) ?? TRIPS; }
export async function getListedTrips(): Promise<{ trips: Trip[]; usingDemoData: boolean }> {
  const items = await databaseTrips();
  // Architecture fixtures are useful for direct developer testing, but they
  // must never become public catalogue content when Supabase is unavailable.
  return { trips: items ?? TRIPS, usingDemoData: false };
}
export async function getFeaturedTrips(): Promise<Trip[]> { const items = await databaseTrips(); return items === null ? FEATURED_TRIPS : items.filter((item) => item.featured); }
export async function getTripBySlug(slug: string): Promise<Trip | undefined> {
  const items = await databaseTrips();
  if (items === null) return findTrip(slug);
  const trip = items.find((item) => item.slug === slug);
  if (!trip?.seatBookingEnabled || !trip.seat) return trip;

  const supabase = await createClient();
  const { data } = await supabase.rpc("trip_taken_seats", { p_trip_id: trip.id });
  const liveTaken = (data ?? [])
    .map((row: { seat_number?: unknown }) => Number(row.seat_number))
    .filter((seat: number) => Number.isInteger(seat));
  return {
    ...trip,
    seat: {
      ...trip.seat,
      taken: Array.from(new Set([...(trip.seat.taken ?? []), ...liveTaken])),
    },
  };
}
export async function getTripSlugs(): Promise<string[]> { const items = await databaseTrips(); return items === null ? allTrips().map((trip) => trip.slug) : items.map((trip) => trip.slug); }
export async function getEvents(): Promise<PlanetEvent[]> { return (await databaseEvents()) ?? EVENTS; }
export async function getListedEvents(): Promise<{ events: PlanetEvent[]; usingDemoData: boolean }> {
  const items = await databaseEvents();
  return { events: items ?? EVENTS, usingDemoData: false };
}
export async function getFeaturedEvents(): Promise<PlanetEvent[]> { const items = await databaseEvents(); return items === null ? FEATURED_EVENTS : items.filter((item) => item.featured); }
export async function getEventBySlug(slug: string): Promise<PlanetEvent | undefined> { const items = await databaseEvents(); return items === null ? findEvent(slug) : items.find((item) => item.slug === slug); }
export async function getEventSlugs(): Promise<string[]> { const items = await databaseEvents(); return items === null ? allEvents().map((event) => event.slug) : items.map((event) => event.slug); }
