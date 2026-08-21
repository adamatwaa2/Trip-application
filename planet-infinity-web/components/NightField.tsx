import type { ReactNode } from "react";

type NightFieldProps = {
  children: ReactNode;
  /** Full-bleed sections touch the screen edge and carry zero radius. */
  bleed?: boolean;
  className?: string;
  id?: string;
};

/**
 * A full-bleed Deep Ink section — used for cinematic contrast, not dark mode.
 * The visitor cannot switch it on; it is a designed section, chosen by us.
 *
 * The rules that govern it (CLAUDE.md, PI-WB-002 Plate 03):
 *   · at most ONE per page, plus the footer
 *   · never two directly adjacent
 *   · never let the site read as predominantly dark — light is the default
 *   · inside: ivory text, orange for decisions, gold for accents
 *
 * The `.pi-night` class also switches the focus ring to ivory so keyboard
 * focus stays visible against Deep Ink.
 */
export function NightField({
  children,
  bleed = true,
  className,
  id,
}: NightFieldProps) {
  return (
    <section
      id={id}
      className={[
        "pi-night",
        "pi-section",
        bleed ? "pi-section--bleed" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
