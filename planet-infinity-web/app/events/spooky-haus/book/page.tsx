import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/content/source";
import { SpookyHausBookingForm } from "@/components/SpookyHausBookingForm";
import { eventPriceSchedule } from "@/lib/scheduled-event-price";
import "@/app/spooky-haus.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Book tickets · Spooky Haus", robots: { index: false, follow: false } };
export default async function Page() {
  const event = await getEventBySlug("spooky-haus");
  if (!event) notFound();
  return <main className="spooky-haus sh-book-page"><div className="sh-wrap"><Link className="sh-back" href="/events/spooky-haus">← Back to Spooky Haus</Link><p className="sh-presenter">Planet Infinity × CUCA Club</p><h1>Your tickets.<br />Your Halloween.</h1><p className="sh-intro">Spooky Haus · Halloween Dinner Party</p><SpookyHausBookingForm price={event.priceEgp ?? 900} schedule={eventPriceSchedule(event.media)} /></div></main>;
}
