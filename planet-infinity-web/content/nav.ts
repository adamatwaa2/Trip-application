/**
 * Planet Infinity — navigation model (PI-WB-002, Plate 06).
 *
 * "Logo · … · one orange CTA. Five items, no dropdown mega-menu."
 *
 * Themes is deliberately absent. It exists in the brand guidelines as a world,
 * but it is not part of the product direction the site sells today, so it is
 * not a navigation destination and does not appear on the homepage.
 *
 * `ready: false` means the route does not exist yet. Those items render as
 * quiet, non-interactive labels rather than links, so navigation never hands
 * anyone a 404. Flip the flag when the route lands.
 */

export type NavItem = {
  label: string;
  href: string;
  /** Does the route exist yet? */
  ready: boolean;
};

/** The two worlds the site sells: travel and events. */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Travel", href: "/trips", ready: true },
  { label: "Events", href: "/events", ready: true },
];

/**
 * The single orange decision in the bar. It points at the trips listing
 * because a booking request starts by choosing what to book — there is no
 * universal booking entry point, and no trip type is assumed.
 */
export const HEADER_CTA: NavItem = {
  label: "Request to book",
  href: "/trips",
  ready: true,
};

/** Guest-facing flows that already exist as preview experiences. */
export const PLAN_LINKS: NavItem[] = [
  { label: "Apply to join", href: "/apply", ready: true },
  { label: "Reserve your seat", href: "/book", ready: true },
];

/** The three parts of the Booking Terms & Guest Policies pack. Not built yet. */
export const POLICY_LINKS: NavItem[] = [
  { label: "Booking terms", href: "/terms", ready: false },
  { label: "Cancellation & refunds", href: "/cancellation-policy", ready: false },
  { label: "Trip etiquette", href: "/etiquette", ready: false },
];
