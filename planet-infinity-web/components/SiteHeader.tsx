"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLockup } from "./BrandLockup";
import { HEADER_CTA, PRIMARY_NAV, type NavItem } from "@/content/nav";

function NavLink({ item, current }: { item: NavItem; current: boolean }) {
  if (item.status === "soon") {
    return (
      <span className="pi-nav__link pi-nav__link--soon" aria-disabled="true">
        {item.label}
        <span className="pi-nav__chip">{item.note ?? "Soon"}</span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`pi-nav__link${current ? " pi-nav__link--current" : ""}`}
      aria-current={current ? "page" : undefined}
    >
      {item.label}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [menuOpen, setMenuOpen] = useState(false);

  /** The Events world carries the violet mark; everywhere else is orange. */
  const world = pathname.startsWith("/events") ? "events" : "general";

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`pi-header${menuOpen ? "" : " pi-header--solid"}`}
        data-menu-open={menuOpen ? "true" : undefined}
      >
        <div className="pi-header__inner">
          <BrandLockup tone={menuOpen ? "ivory" : "ink"} world={world} />

          <nav className="pi-nav" aria-label="Primary">
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                current={isCurrent(item.href)}
              />
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
        Rendered as a SIBLING of <header> on purpose: the bar carries
        backdrop-filter, which becomes the containing block for position:fixed
        descendants and would pin this panel to the bar's own box.
      */}
      <div
        id="pi-mobile-menu"
        className="pi-mobile pi-night"
        hidden={!menuOpen}
        aria-label="Primary"
      >
        <nav className="pi-mobile__nav">
          {PRIMARY_NAV.map((item) =>
            item.status === "ready" ? (
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
                className="pi-mobile__link pi-mobile__link--soon"
                aria-disabled="true"
              >
                {item.label}
                <span className="pi-nav__chip">{item.note ?? "Soon"}</span>
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
