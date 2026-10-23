import Link from "next/link";
import type { PlanetEvent } from "@/content/events/types";
import { SpookyHausPrice } from "@/components/SpookyHausPrice";
import { eventPriceSchedule } from "@/lib/scheduled-event-price";
export function SpookyHausPage({ event }: { event: PlanetEvent }) {
  return <main className="spooky-haus">
    <div className="sh-curtain sh-curtain-left" aria-hidden="true" /><div className="sh-curtain sh-curtain-right" aria-hidden="true" />
    <section className="sh-hero sh-wrap" aria-labelledby="sh-title">
      <div className="sh-hero-copy">
        <Link className="sh-back" href="/events">← All events</Link>
        <p className="sh-presenter">Planet Infinity × CUCA Club</p>
        <div className="sh-date-stamp"><span>THU</span><strong>29</strong><span>OCT 2026</span></div>
        <p className="sh-kicker">You are invited to dinner after dark</p>
        <h1 id="sh-title">Spooky<br /><span>Haus</span></h1>
        <p className="sh-subtitle">Halloween Dinner Party</p>
        <p className="sh-intro">For those who seek good company,<br className="sh-desktop-break" /> not just another party.</p>
        <div className="sh-meta"><span>29 October 2026</span><span>8 PM – 12 AM · Doors 7 PM</span><span>CUCA Club · Mokattam, Cairo</span></div>
        <Link className="sh-button" href="/events/spooky-haus/book">Request your place <span aria-hidden="true">↗</span></Link>
        <p className="sh-small">Private community. Limited places. Good energy only.</p>
      </div>
      <figure className="sh-poster"><img src={event.media.hero} alt={event.media.heroAlt ?? event.title} width="1122" height="1402" fetchPriority="high" /><figcaption>The evening, in one invitation.</figcaption></figure>
    </section>
    <div className="sh-marquee" aria-label="Admission rules">18+ <span>✦</span> Costumes mandatory <span>✦</span> No alcohol <span>✦</span> No drugs <span>✦</span> Couples & mixed groups only</div>
    <section className="sh-story sh-wrap" aria-labelledby="sh-story-title">
      <div><p className="sh-kicker">A different kind of Halloween</p><h2 id="sh-story-title">A little spooky.<br />A lot of good company.</h2></div>
      <div className="sh-story-copy"><p>Dress up. Come together. Settle into an evening that feels a little different.</p><p>Spooky Haus brings Planet Infinity and CUCA Club together for a Halloween dinner party with its own rhythm: warm, easy-going, and built around the people in the room.</p><p>A private community for those who love a thoughtful setting, genuine connection, and a night that feels like their kind of crowd.</p></div>
    </section>
    <section className="sh-invitation sh-wrap" aria-labelledby="sh-invitation-title">
      <div className="sh-ticket-main"><p className="sh-kicker">The invitation</p><h2 id="sh-invitation-title">Come as a character.<br />Leave with a story.</h2><p>Thursday, 29 October · CUCA Club, Mokattam</p><div className="sh-rule-list"><span>18+ only</span><span>Couples or mixed groups only</span><span>Costumes mandatory</span><span>No alcohol. No drugs.</span></div><p className="sh-small">Limited places in a private community. Requests are reviewed by our team; submitting a request is not a confirmed booking.</p></div>
      <aside className="sh-ticket-price"><SpookyHausPrice price={event.priceEgp ?? 900} schedule={eventPriceSchedule(event.media)} /><Link className="sh-button" href="/events/spooky-haus/book">Request your place ↗</Link><p className="sh-small">No payment is taken when sending a request.</p></aside>
    </section>
    <section className="sh-faq sh-wrap" aria-labelledby="sh-faq-title"><p className="sh-kicker">Before the curtain rises</p><h2 id="sh-faq-title">A few things to know.</h2>
      <details><summary>When should we arrive?</summary><p>Doors open at 7 PM on Thursday, 29 October. The dinner party runs from 8 PM until midnight. All times are local Cairo time.</p></details>
      <details><summary>Who is this evening for?</summary><p>Guests aged 18 and over, attending as couples or mixed groups. Spooky Haus is a private community with limited places. Every request is reviewed by the team.</p></details>
      <details><summary>What should we wear?</summary><p>Costumes are mandatory. Bring your character, your friends, and your good energy.</p></details>
      <details><summary>Is alcohol allowed?</summary><p>No alcohol and no drugs. We are keeping the evening comfortable and welcoming for our community.</p></details>
      <details><summary>What happens after I request a place?</summary><p>You receive a request reference. Our team reviews your request and shares confirmation and payment instructions separately. Sending a request does not reserve a confirmed ticket or lock in a paid booking.</p></details>
      <details><summary>Where can I find the dinner and arrival details?</summary><p>The venue is CUCA Club in Mokattam, Cairo. The team will share the exact arrival instructions and confirm the menu and what your admission includes before payment.</p></details>
    </section>
    <div className="sh-closing sh-wrap"><span aria-hidden="true">✦</span><p>Good people.<br />A beautifully strange evening.</p><Link className="sh-button" href="/events/spooky-haus/book">See you at Spooky Haus ↗</Link></div>
  </main>;
}
