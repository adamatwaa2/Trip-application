/**
 * Planet Infinity — navigation model (PI-WB-002, Plate 06).
 *
 * "Logo · Travel · Events · Themes · one orange CTA. Five items, no dropdown
 * mega-menu." That structure is fixed; only the `ready` flags move.
 *
 * `ready: false` means the route does not exist yet in this phased build. Those
 * items render as quiet, non-interactive labels rather than links, so the shell
 * never hands anyone a 404. Flip the flag when the phase that builds the page
 * lands — nothing else needs to change.
 */

export type NavItem = {
  label: string;
  href: string;
  /** Does the route exist yet? */
  ready: boolean;
};

/** The three worlds. Built in Phase 5. */
export const WORLDS: NavItem[] = [
  { label: "Travel", href: "/travel", ready: false },
  { label: "Events", href: "/events", ready: false },
  { label: "Themes", href: "/themes", ready: false },
];

/** The single orange decision in the bar. */
export const HEADER_CTA: NavItem = {
  label: "Request to book",
  href: "/book",
  ready: true,
};

/** Guest-facing flows that already exist. */
export const PLAN_LINKS: NavItem[] = [
  { label: "Apply to join", href: "/apply", ready: true },
  { label: "Reserve your seat", href: "/book", ready: true },
];

/** The three parts of the Booking Terms & Guest Policies pack. Built in Phase 8. */
export const POLICY_LINKS: NavItem[] = [
  { label: "Booking terms", href: "/terms", ready: false },
  { label: "Cancellation & refunds", href: "/cancellation-policy", ready: false },
  { label: "Trip etiquette", href: "/etiquette", ready: false },
];
