import type { ReactNode } from "react";

/**
 * Mono eyebrow — 11px, .22em caps (PI-WB-002, Plate 04 · MICRO).
 * Ember on ivory at this size is a documented brand exception; on Deep Ink it
 * switches to gold.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={["pi-eyebrow", className].filter(Boolean).join(" ")}>
      {children}
    </p>
  );
}
