import Link from "next/link";
import type { PlanetEvent } from "@/content/events";
import { HALLOWEEN_TERMS } from "@/content/events/halloween";
import { halloweenClassName, halloweenHref, type HalloweenAppearance } from "@/lib/halloween-appearance";
import "@/app/halloween.css";
import "@/app/halloween-night.css";
import "@/app/halloween-blend.css";

export function HalloweenPreviewBar({ appearance = "paper", booking = false }: { appearance?: HalloweenAppearance; booking?: boolean }) {
  return <nav className="hw-preview-bar" aria-label="Halloween design comparison"><strong>Design comparison</strong><Link href={halloweenHref("paper", booking)} aria-current={appearance === "paper" ? "page" : undefined}>01 / Paper</Link><Link href={halloweenHref("night", booking)} aria-current={appearance === "night" ? "page" : undefined}>02 / After dark</Link><Link href={halloweenHref("blend", booking)} aria-current={appearance === "blend" ? "page" : undefined}>03 / The mix</Link><span className="hw-preview-divider" aria-hidden="true"/><Link href={halloweenHref(appearance)}>Event</Link><Link href={halloweenHref(appearance,true)}>Booking</Link><Link href="/preview/halloween/admin">Admin preview</Link><small>Local preview · no live payments</small></nav>;
}

export function HalloweenTicket({ event, children, appearance = "paper" }: { event: PlanetEvent; children?: React.ReactNode; appearance?: HalloweenAppearance }) {
  return <aside className="hw-ticket">
    <div className="hw-ticket-heading"><h3>General admission</h3><span>{event.ticketLabel ?? "Early Bird · Very limited"}</span></div>
    <p className="hw-price">{event.priceEgp ? `${event.priceEgp.toLocaleString("en-US")} EGP` : "Price to be announced"}</p>
    {Boolean(event.bookingFeeEgp) ? <p className="hw-fee-note">+{event.bookingFeeEgp} EGP booking fee per ticket</p> : null}
    <p className="hw-smallprint">Per person · 100% paid at booking</p>
    <ul><li>{event.eventDate} · {event.startTime} — {event.endTime}</li><li>{event.venue} · location revealed one day before</li><li>Mixed groups, couples or girls only</li></ul>
    {children ?? <Link className="hw-button" href={halloweenHref(appearance,true)}>Book your night <span aria-hidden="true">↗</span></Link>}
    <div className="hw-ticket-bottom"><span>NON-REFUNDABLE · NON-TRANSFERABLE</span><strong>PI / 30.10</strong></div>
  </aside>;
}

export function HalloweenEventPage({ event, appearance = "paper" }: { event: PlanetEvent; appearance?: HalloweenAppearance }) {
  const titleWords = event.title.split(" ");
  return <div className={halloweenClassName(appearance)}>
    {process.env.NODE_ENV === "development" ? <HalloweenPreviewBar appearance={appearance} /> : null}
    <div className="hw-wrap">
      <div className="hw-topline"><Link href="/events">← Back to events</Link><span>Planet Infinity presents</span><a href="#hw-tickets">30 / 10 / 26 ↗</a></div>
      <section className="hw-hero" aria-labelledby="hw-title">
        <div className="hw-ghost" aria-hidden="true"/><div className="hw-pumpkin" aria-hidden="true"/><div className="hw-orbit" aria-hidden="true"/>
        <span className="hw-hero-tag">Your next world · after dark</span>
        <div className="hw-hero-content">
          <p className="hw-eyebrow">One night. Another world.</p>
          <h1 className="hw-title" id="hw-title"><span>{titleWords.slice(0,-1).join(" ") || event.title}</span>{titleWords.length > 1 ? <span>{titleWords.at(-1)}</span> : null}</h1>
          <p className="hw-date">{event.eventDate}</p>
          <p className="hw-early-bird">{event.ticketLabel ?? "Early Bird · Very limited"}</p>
          <p className="hw-description">Your alter ego has an invitation.<br/>Step out of the ordinary. Into the unexpected.</p>
          <div className="hw-hero-actions"><a className="hw-button" href="#hw-tickets">Enter the night <span aria-hidden="true">↗</span></a><a className="hw-text-link" href="#hw-experience">Discover the experience ↓</a></div>
          <p className="hw-hero-note">CAIRO · 7 PM — 2 AM · COSTUMES ENCOURAGED</p>
        </div>
      </section>
      <dl className="hw-facts"><div><dt>The date</dt><dd>{event.eventDate}</dd></div><div><dt>The hours</dt><dd>{event.startTime} — {event.endTime}</dd></div><div><dt>The place</dt><dd>{event.venue}</dd></div><div><dt>The dress code</dt><dd>Come as your alter ego</dd></div></dl>
      <section className="hw-section" id="hw-experience">
        <div className="hw-section-head"><div><p className="hw-eyebrow">Not your ordinary night</p><h2>Expect the<br/>unexpected.</h2></div><p>{event.description[0] ?? event.shortDescription}</p></div>
        <div className="hw-experiences">
          <article className="hw-experience"><span>01 / THE SOUND</span><b aria-hidden="true">↯</b><div><h3>DJ sets.</h3><p>A dance floor, your people, and a night with its own pulse.</p></div></article>
          <article className="hw-experience"><span>02 / THE ENERGY</span><b aria-hidden="true">✳</b><div><h3>Live acts.</h3><p>Out of the ordinary. Right in the middle of your night.</p></div></article>
          <article className="hw-experience"><span>03 / THE UNKNOWN</span><b aria-hidden="true">?</b><div><h3>Surprise moments.</h3><p>Some things are better kept secret. Until you are there.</p></div></article>
        </div>
        <p className="hw-smallprint">The final line-up and food & drink details will be announced here. Only inclusions explicitly listed with your ticket are included.</p>
      </section>
    </div>
    {appearance === "blend" ? <div className="hw-dawn-transition" aria-hidden="true"><span>One night. More than one world. ∞</span></div> : null}
    <section className="hw-section hw-ticket-section" id="hw-tickets"><div className="hw-wrap hw-ticket-layout"><div><p className="hw-eyebrow">Your invitation to the unknown</p><h2>Bring your people.<br/>Find your world.</h2><p>Choose your tickets, add your guest details, and pay in full using InstaPay / Vodafone Cash or Paymob.</p><p className="hw-smallprint">Door selection applies. Payment does not guarantee admission. Read the event terms before paying.</p></div><HalloweenTicket event={event} appearance={appearance}/></div></section>
    <div className="hw-light-ending"><div className="hw-wrap">
      <section className="hw-section" id="hw-terms"><div className="hw-terms-layout"><div><p className="hw-eyebrow">Before you enter</p><h2>The night.<br/>The rules.</h2><div className="hw-location"><h3>A location worth the wait.</h3><p>Cairo for now. The exact location and arrival instructions will reach confirmed guests one day before the event.</p></div><p className="hw-smallprint"><Link href="/policies/events-payment">Events — Payment & Booking Confirmation ↗</Link></p></div><ol className="hw-term-list">{HALLOWEEN_TERMS.map((term,index)=><li key={term}><span>{String(index+1).padStart(2,"0")}</span>{term}</li>)}</ol></div></section>
      <section className="hw-section" style={{paddingTop:0}}><div className="hw-section-head"><div><p className="hw-eyebrow">A few things to know</p><h2>Before the night.</h2></div></div><div className="hw-faq">
        <details><summary>How does booking work?</summary><p>Choose your tickets, enter every guest&apos;s details, accept the event policies and pay 100% of the total. Transfers are reviewed before payment is verified. Final confirmation is issued separately.</p></details>
        <details><summary>Can I get a refund if I am not selected?</summary><p>Tickets are non-refundable and non-transferable, including refusal through selection, subject to applicable law. Door selection applies even with a confirmed reservation.</p></details>
        <details><summary>Do I need a costume?</summary><p>Costumes are encouraged. Come as your alter ego — and bring your original physical ID.</p></details>
        <details><summary>Are food and drinks included?</summary><p>Food and drink arrangements have not been announced yet. They are included only if your ticket explicitly lists them.</p></details>
      </div></section>
      <div className="hw-bottom"><span>Planet Infinity · Entertainment</span><span>One brand. More than one world. ∞</span></div>
    </div></div>
  </div>;
}
