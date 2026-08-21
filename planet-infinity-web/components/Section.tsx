import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  /**
   * `ivory` — the default canvas.
   * `white` — a lighter alternate band, for pace between ivory sections.
   *
   * Deep Ink is deliberately not an option here. Dark sections go through
   * <NightField>, which carries the rules that govern them.
   */
  tone?: "ivory" | "white";
  /** `full` bleeds to the viewport edge and owns its own padding. */
  bleed?: boolean;
  className?: string;
  id?: string;
};

/**
 * A page band with the brand's vertical rhythm: 128px desktop, 96px tablet,
 * 72px mobile (PI-WB-002, Plate 05).
 */
export function Section({
  children,
  tone = "ivory",
  bleed = false,
  className,
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={[
        "pi-section",
        `pi-section--${tone}`,
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
