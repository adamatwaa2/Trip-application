"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ExplorePlanet3D } from "@/components/ExplorePlanet3D";
import { CatalogThemeRuntime } from "@/components/CatalogThemeRuntime";
import type { CatalogVisualTheme } from "@/lib/catalog-visual-theme";

export type ExploreCatalogItem = {
  slug: string;
  title: string;
  kicker: string;
  href: string;
  background?: string;
  theme?: CatalogVisualTheme;
};

type ExploreUniverseProps = {
  trips: ExploreCatalogItem[];
  events: ExploreCatalogItem[];
  tripCount: number;
  eventCount: number;
};

type WorldId = "core" | "travel" | "events";

const GOLD_THEME: CatalogVisualTheme = {
  primaryColor: "#ef941d",
  secondaryColor: "#ffd479",
  surface: "light",
  finish: "soft-metal",
  background: "sea-blur",
};

function fallbackThemeFor(item: ExploreCatalogItem) {
  if (item.theme) return item.theme;
  return GOLD_THEME;
}

export function ExploreUniverse({ trips, events, tripCount, eventCount }: ExploreUniverseProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeWorld, setActiveWorld] = useState<WorldId>("core");
  const [selectedTrip, setSelectedTrip] = useState(trips[0]?.slug ?? "");
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.slug ?? "");

  const worlds = useMemo(() => ([
    {
      id: "core" as const,
      number: "00",
      tone: "gold",
      eyebrow: "Planet Infinity",
      title: "One planet. More than one world.",
      body: "Move through travel and events as connected worlds. The exact Planet Infinity mark gains depth, light and movement, then adopts each experience's visual identity.",
      note: `${tripCount} trips · ${eventCount} events`,
    },
    {
      id: "travel" as const,
      number: "01",
      tone: "gold",
      eyebrow: "Travel world",
      title: "Trips with their own atmosphere.",
      body: "Choose a trip below. Its colours, finish and mood move onto the planet before you open the full page.",
      note: tripCount ? `${tripCount} live trip${tripCount === 1 ? "" : "s"}` : "Trips coming soon",
    },
    {
      id: "events" as const,
      number: "02",
      tone: "gold",
      eyebrow: "Events world",
      title: "Every gathering has a different pulse.",
      body: "Each event can be bright, dark, soft or cinematic. Select one to preview its identity on the 3D world.",
      note: eventCount ? `${eventCount} live event${eventCount === 1 ? "" : "s"}` : "Events coming soon",
    },
  ]), [eventCount, tripCount]);

  const worldIndex = worlds.findIndex((world) => world.id === activeWorld);
  const activeItems = activeWorld === "travel" ? trips : activeWorld === "events" ? events : [];
  const selectedSlug = activeWorld === "travel" ? selectedTrip : selectedEvent;
  const selectedIndex = Math.max(activeItems.findIndex((item) => item.slug === selectedSlug), 0);
  const selectedItem = activeItems[selectedIndex];
  const selectedTheme = selectedItem
    ? fallbackThemeFor(selectedItem)
    : undefined;
  const active = worlds[Math.max(worldIndex, 0)];
  const rootStyle = {
    "--pi-world-accent": selectedTheme?.primaryColor,
    "--pi-world-glow": selectedTheme?.secondaryColor
      ? `color-mix(in srgb, ${selectedTheme.secondaryColor} 38%, transparent)`
      : undefined,
    "--pi-world-photo": selectedItem?.background
      ? `url("${selectedItem.background.replace(/["\\]/g, "")}")`
      : "none",
    "--pi-world-object-scale": selectedTheme?.explorerScale ?? 1,
  } as CSSProperties;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const update = () => {
      const bounds = root.getBoundingClientRect();
      const scrollable = Math.max(root.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -bounds.top / scrollable));
      root.style.setProperty("--pi-world-progress", progress.toFixed(4));

      const viewportTarget = window.innerHeight * .5;
      const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-world-step]"));
      let closest = steps[0];
      let closestDistance = Number.POSITIVE_INFINITY;
      for (const step of steps) {
        const stepBounds = step.getBoundingClientRect();
        const distance = Math.abs(stepBounds.top + stepBounds.height * .5 - viewportTarget);
        if (distance < closestDistance) {
          closest = step;
          closestDistance = distance;
        }
      }
      const next = closest?.dataset.worldStep as WorldId | undefined;
      if (next) setActiveWorld(next);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const goToWorld = (id: WorldId) => {
    document.getElementById(`world-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section
      ref={rootRef}
      className="pi-universe"
      data-tone={active.tone}
      data-surface={selectedTheme?.surface ?? "light"}
      data-background={selectedTheme?.background ?? "clean"}
      data-depth={selectedTheme?.depth ?? "raised"}
      data-typography={selectedTheme?.typography ?? "brand"}
      style={rootStyle}
      aria-label="Planet Infinity interactive worlds"
    >
      {selectedTheme ? <CatalogThemeRuntime theme={selectedTheme} /> : null}
      <div className="pi-universe__visual" aria-live="polite">
        <div className="pi-universe__planet-wrap">
          <div className="pi-universe__halo" aria-hidden="true" />
          <ExplorePlanet3D theme={selectedTheme} />
          <span className="pi-universe__counter">{String(worldIndex + 1).padStart(2, "0")} / 03</span>
        </div>
      </div>

      <div className="pi-universe__worlds">
        {worlds.map((world) => {
          const items = world.id === "travel" ? trips : world.id === "events" ? events : [];
          const chosen = world.id === "travel" ? selectedTrip : selectedEvent;
          const selected = items.find((item) => item.slug === chosen) ?? items[0];
          return (
            <article
              id={`world-${world.id}`}
              key={world.id}
              data-world-step={world.id}
              className={`pi-universe__world${activeWorld === world.id ? " is-active" : ""}`}
            >
              <span className="pi-universe__number">{world.number} · {world.eyebrow}</span>
              <h2>{world.title}</h2>
              <p>{world.body}</p>

              {world.id === "core" ? (
                <div className="pi-universe__switcher">
                  <button type="button" onClick={() => goToWorld("travel")}>Explore travel</button>
                  <button type="button" onClick={() => goToWorld("events")}>Explore events</button>
                </div>
              ) : items.length ? (
                <div className="pi-universe__catalog" aria-label={`${world.eyebrow} experiences`}>
                  <div className="pi-universe__catalog-list">
                    {items.map((item) => {
                      const isSelected = item.slug === selected?.slug;
                      return (
                        <button
                          key={item.slug}
                          type="button"
                          className={`pi-universe__catalog-button${isSelected ? " is-selected" : ""}`}
                          aria-pressed={isSelected}
                          onClick={() => world.id === "travel" ? setSelectedTrip(item.slug) : setSelectedEvent(item.slug)}
                        >
                          {item.theme?.logo && /\.png(?:$|[?#])/i.test(item.theme.logo) ? (
                            // Admin-managed public media can come from the configured storage host.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="pi-universe__catalog-mark" src={item.theme.logo} alt="" aria-hidden="true" />
                          ) : <span className="pi-universe__catalog-dot" aria-hidden="true" />}
                          <span>{item.title}</span>
                          <small>{item.kicker}</small>
                        </button>
                      );
                    })}
                  </div>
                  {selected ? <Link className="pi-universe__open" href={selected.href}>Open {world.id === "travel" ? "trip" : "event"} details <span aria-hidden="true">↗</span></Link> : null}
                </div>
              ) : (
                <p className="pi-universe__empty">The next experience is taking shape.</p>
              )}

              <div className="pi-universe__world-footer">
                <strong>{world.note}</strong>
                {world.id !== "core" ? <button type="button" className="pi-universe__return" onClick={() => goToWorld("core")}>Back to the planet</button> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
