import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/content/source";
import { SpookyHausBookingForm } from "@/components/SpookyHausBookingForm";
import { eventPriceSchedule } from "@/lib/scheduled-event-price";
import "@/app/spooky-haus.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your invitation · Spooky Haus", robots: { index: false, follow: false } };
export default async function Page() {
  const event = await getEventBySlug("spooky-haus");
  if (!event) notFound();
  return <main className="spooky-haus sh-book-page"><div className="sh-wrap"><Link className="sh-back" href="/events/spooky-haus">← Back to Spooky Haus</Link><p className="sh-presenter">Planet Infinity × CUCA Club</p><h1>Your seat<br />at the table.</h1><p className="sh-intro">A private evening. A different kind of crowd.</p><SpookyHausBookingForm eventId={event.id} title={event.title} price={event.priceEgp ?? 900} schedule={eventPriceSchedule(event.media)} /></div></main>;
}
