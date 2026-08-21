import type { ReactNode } from "react";

/** A small label. Neutral by default; gold is reserved for scarcity. */
export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "quiet";
}) {
  return <span className={`pi-pill pi-pill--${tone}`}>{children}</span>;
}
