import Link from "next/link";
import type { PlanetEvent } from "@/content/events/types";
import { SpookyHausPrice } from "@/components/SpookyHausPrice";
import { eventPriceSchedule } from "@/lib/scheduled-event-price";
import { GalleryLightbox } from "@/components/GalleryLightbox";
export function SpookyHausPage({ event }: { event: PlanetEvent }) {
 const venuePhotos = (event.media.gallery ?? [])
  .filter((photo) => photo.type !== "video" && photo.src !== event.media.hero)
  .map((photo, index) => ({ ...photo, alt: `Spooky Haus venue · Penthouse, Mokattam · photo ${index + 1}` }));
 return <main className="spooky-haus sh-poster-page">
  <h1 className="sh-sr-only">Spooky Haus — Halloween Dinner Party</h1>
  <section className="sh-poster-stage" aria-label="Spooky Haus invitation">
   <img className="sh-original-poster" src={event.media.hero} alt={event.media.heroAlt ?? event.title} width="1122" height="1402" fetchPriority="high" />
  </section>
  <section className="sh-details sh-wrap" aria-label="Event details and admission">
   <div><p className="sh-kicker">Planet Infinity × CUCA Club · In collaboration</p><h2>Your kind of people.<br />Your kind of Halloween.</h2><p>For those who seek good company, not just another party. A private community. Limited places. A warm, easy-going evening.</p></div>
   <div className="sh-details-right"><p><strong>Thursday, 29 October 2026</strong><br />Doors 7 PM · Dinner party 8 PM – 12 AM<br />Venue: Penthouse · Mokattam, Cairo<br />Indoor lounge & rooftop</p><p><strong>18+ · Costumes mandatory</strong><br />Couples, mixed groups or girls-only.<br />No alcohol. No drugs.</p><details><summary>Arrival & dinner details</summary><p>The team will share the exact arrival instructions and confirm the dinner details. Please review the <Link href="/policies/events-payment">event payment policy</Link> before booking.</p></details></div>
  </section>
  {venuePhotos.length ? <section id="venue" className="sh-venue sh-wrap" aria-labelledby="sh-venue-title">
   <div className="sh-venue-heading"><div><p className="sh-kicker">Penthouse · Mokattam, Cairo</p><h2 id="sh-venue-title">VENUE</h2></div><p>Indoor lounge & rooftop. Take a look around.<br />Tap any photo to view it in full.</p></div>
   <GalleryLightbox images={venuePhotos} layout="grid" />
  </section> : null}
  <div className="sh-admission-bar"><div className="sh-admission-inner"><SpookyHausPrice price={event.priceEgp ?? 900} schedule={eventPriceSchedule(event.media)} bookingFee={event.bookingFeeEgp??0} /><Link className="sh-button" href="/events/spooky-haus/book">Book tickets</Link></div></div>
 </main>;
}
