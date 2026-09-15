"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties } from "react";
import type { PlanetEvent } from "@/content/events";
import type { Trip } from "@/content/trips";

type DeckItem = { id: string; href: string; title: string; eyebrow: string; image?: string; imageAlt: string; video?: string };

function ExperienceDeck({ label, items, tone }: { label: string; items: DeckItem[]; tone: "trip" | "event" }) {
  const [active, setActive] = useState(0);
  const router = useRouter();
  const hoverLocked = useRef(false);
  const visibleCount = Math.min(items.length, 3);

  return (
    <section className={`pi-experience-deck pi-experience-deck--${tone} pi-experience-deck--count-${visibleCount}`} aria-label={label}>
      <div className="pi-experience-deck__cards" onPointerLeave={() => { hoverLocked.current = false; }}>
        {items.length ? items.map((item, index) => {
          const offset = (index - active + items.length) % items.length;
          const hidden = offset >= visibleCount;
          const style = { "--deck-position": Math.min(offset, 2), "--deck-layer": visibleCount - Math.min(offset, 2) } as CSSProperties;
          return (
            <button className={`pi-experience-deck__card${offset === 0 ? " is-active" : " pi-experience-deck__card--peek"}${hidden ? " is-hidden" : ""}`} type="button" key={item.id} style={style} aria-label={offset === 0 ? `View ${item.title}` : `Bring ${item.title} to the front`} aria-current={offset === 0 ? "true" : undefined} tabIndex={hidden ? -1 : 0} onPointerEnter={(event) => { if (event.pointerType !== "mouse" || offset === 0 || hoverLocked.current) return; hoverLocked.current = true; setActive(index); }} onClick={() => offset === 0 ? router.push(item.href) : setActive(index)}>
              <div className="pi-experience-deck__media">
                {!hidden && item.video ? <video src={item.video} poster={item.image} autoPlay loop muted playsInline preload="metadata" aria-label={`${item.title} preview`} /> : item.image ? <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 899px) 44vw, 260px" /> : <span className="pi-experience-deck__fallback" aria-hidden="true">∞</span>}
              </div>
              <div className="pi-experience-deck__scrim" />
              <div className="pi-experience-deck__copy"><span>{item.eyebrow}</span><strong>{item.title}</strong>{offset === 0 ? <b>View details →</b> : null}</div>
            </button>
          );
        }) : <div className="pi-experience-deck__empty"><span>∞</span><strong>New experiences soon</strong></div>}
      </div>
      <div className="pi-experience-deck__foot"><Link href={tone === "trip" ? "/trips" : "/events"}>{label}</Link>{items.length > 1 ? <span className="pi-experience-deck__count">{active + 1}/{items.length}</span> : null}</div>
    </section>
  );
}

export function HomeExperienceDecks({ trips, events }: { trips: Trip[]; events: PlanetEvent[] }) {
  const tripItems: DeckItem[] = trips.map((trip) => ({ id: trip.id, href: `/trips/${trip.slug}`, title: trip.title, eyebrow: trip.destination, image: trip.media.hero, imageAlt: trip.media.heroAlt ?? "", video: trip.media.video }));
  const eventItems: DeckItem[] = events.map((event) => ({ id: event.id, href: event.media.linkedTripSlug ? `/trips/${event.media.linkedTripSlug}` : `/events/${event.slug}`, title: event.title, eyebrow: event.category, image: event.media.hero, imageAlt: event.media.heroAlt ?? "", video: event.media.video }));
  return <div className="pi-home-decks"><ExperienceDeck label="Explore Trips" items={tripItems} tone="trip" /><ExperienceDeck label="Explore Events" items={eventItems} tone="event" /></div>;
}
