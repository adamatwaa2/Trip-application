"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLockup } from "./BrandLockup";
import { HEADER_CTA, WORLDS, type NavItem } from "@/content/nav";

type SiteHeaderProps = {
  /**
   * True on pages whose hero sits behind the bar. The bar then starts
   * transparent with ivory links and solidifies after 80px of scroll
   * (PI-WB-002, Plate 06). Phase 4 sets this on the homepage; until a hero
   * exists, every page uses the solid ivory bar.
   */
  overHero?: boolean;
};

function NavLink({ item }: { item: NavItem }) {
  if (!item.ready) {
    return (
      <span
        className="pi-nav__link pi-nav__link--pending"
        aria-disabled="true"
        title="This page is not built yet"
      >
        {item.label}
      </span>
    );
  }

  return (
    <Link href={item.href} className="pi-nav__link">
      {item.label}
    </Link>
  );
}

export function SiteHeader({ overHero = false }: SiteHeaderProps) {
  const [solid, setSolid] = useState(!overHero);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!overHero) return;

    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  // Escape closes the panel, and the page behind it does not scroll.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        /* The solid bar is dropped while the panel is open: its blur is what
           makes the bar a containing block, and over a flat night field the
           blur buys nothing anyway. */
        className={`pi-header${solid && !menuOpen ? " pi-header--solid" : ""}`}
        data-menu-open={menuOpen ? "true" : undefined}
      >
        <div className="pi-header__inner">
          <BrandLockup tone={solid && !menuOpen ? "ink" : "ivory"} />

          {/* Five items, no mega-menu. */}
          <nav className="pi-nav" aria-label="Primary">
            {WORLDS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          <Link
            href={HEADER_CTA.href}
            className="pi-btn pi-btn--primary pi-header__cta"
          >
            {HEADER_CTA.label}
          </Link>

          <button
            type="button"
            className="pi-burger"
            aria-expanded={menuOpen}
            aria-controls="pi-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="pi-visually-hidden">
              {menuOpen ? "Close menu" : "Open menu"}
            </span>
            <span className="pi-burger__bars" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/*
        Mobile panel: a full-height night field, links at display scale.
        Rendered as a SIBLING of <header> on purpose. The bar carries
        backdrop-filter, which makes it a containing block for position:fixed
        descendants — nesting the panel inside pinned it to the bar's own box
        instead of the viewport.
      */}
      <div
        id="pi-mobile-menu"
        className="pi-mobile pi-night"
        hidden={!menuOpen}
        aria-label="Primary"
      >
        <nav className="pi-mobile__nav">
          {WORLDS.map((item) =>
            item.ready ? (
              <Link
                key={item.href}
                href={item.href}
                className="pi-mobile__link"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.href}
                className="pi-mobile__link pi-mobile__link--pending"
                aria-disabled="true"
              >
                {item.label}
              </span>
            )
          )}
        </nav>

        <Link
          href={HEADER_CTA.href}
          className="pi-btn pi-btn--primary pi-mobile__cta"
          onClick={() => setMenuOpen(false)}
        >
          {HEADER_CTA.label}
        </Link>
      </div>
    </>
  );
}
