/**
 * Planet Infinity — site navigation.
 *
 * This is a company website, not a two-link storefront: Home, the two active
 * worlds, a discovery surface, Contact, and Themes shown as a future world
 * rather than deleted.
 *
 * `status` decides how an item renders:
 *   ready   a normal link
 *   soon    visible, not clickable, carries a "Soon" chip — the route does
 *           not exist yet and navigation never hands anyone a 404
 */
export type NavStatus = "ready" | "soon";

export type NavItem = {
  label: string;
  href: string;
  status: NavStatus;
  /** Shown on the chip for `soon` items. */
  note?: string;
};

/** The header's primary navigation. */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/", status: "ready" },
  { label: "Travel", href: "/trips", status: "ready" },
  { label: "Events", href: "/events", status: "ready" },
  { label: "Explore", href: "/explore", status: "ready" },
  { label: "Contact", href: "/contact", status: "ready" },
  { label: "Themes", href: "/themes", status: "soon", note: "Soon" },
];

/**
 * The single orange decision in the bar. It points at Explore because there
 * is no universal booking entry point — a visitor chooses what to book first,
 * and trips and events are booked differently from each other.
 */
export const HEADER_CTA: NavItem = {
  label: "Explore trips",
  href: "/trips",
  status: "ready",
};

/** The two worlds that are actually selling today. */
export const WORLD_NAV: NavItem[] = [
  { label: "Travel", href: "/trips", status: "ready" },
  { label: "Events", href: "/events", status: "ready" },
];

/** Guest-facing flows that already exist. */
export const PLAN_LINKS: NavItem[] = [
  { label: "Apply to join", href: "/apply", status: "ready" },
  { label: "Seat selection preview", href: "/book", status: "ready" },
];

/** Company / about surfaces. */
export const COMPANY_LINKS: NavItem[] = [
  { label: "Explore", href: "/explore", status: "ready" },
  { label: "Contact", href: "/contact", status: "ready" },
];

/** Parts of the universe that are not open yet. */
export const COMING_SOON_LINKS: NavItem[] = [
  { label: "Themes", href: "/themes", status: "soon", note: "Soon" },
  { label: "Merch", href: "/merch", status: "soon", note: "Soon" },
];

/** Public trust and booking-policy surfaces. */
export const POLICY_LINKS: NavItem[] = [
  { label: "All policies", href: "/policies", status: "ready" },
  { label: "Booking terms", href: "/policies/booking", status: "ready" },
  { label: "Payment", href: "/policies/payment", status: "ready" },
  { label: "Cancellation", href: "/policies/cancellation", status: "ready" },
  { label: "Refunds", href: "/policies/refund", status: "ready" },
  { label: "Trip etiquette", href: "/policies/etiquette", status: "ready" },
  { label: "Privacy", href: "/policies/privacy", status: "ready" },
];
