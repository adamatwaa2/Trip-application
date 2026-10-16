export type HalloweenAppearance = "paper" | "night" | "blend";

export function halloweenHref(appearance: HalloweenAppearance, booking = false) {
  return `/events/halloween-party-2026${booking ? "/book" : ""}?look=${appearance}`;
}

export function halloweenAppearance(value?: string): HalloweenAppearance {
  return value === "night" || value === "paper" ? value : "blend";
}

export function halloweenClassName(appearance: HalloweenAppearance) {
  return `hw${appearance !== "paper" ? " hw--night" : ""}${appearance === "blend" ? " hw--blend" : ""}`;
}
