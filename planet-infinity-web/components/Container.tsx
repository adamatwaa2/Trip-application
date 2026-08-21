import type { ElementType, ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  /**
   * `default` — 1180px. Cards, grids, galleries, tables.
   * `read`    — 760px. Any block of continuous prose: itineraries, policies.
   */
  size?: "default" | "read";
  as?: ElementType;
  className?: string;
};

/**
 * Centred content column with the brand's 28px page margin (PI-WB-002, Plate 05).
 * Never wider than --pi-max.
 */
export function Container({
  children,
  size = "default",
  as: Tag = "div",
  className,
}: ContainerProps) {
  return (
    <Tag
      className={["pi-container", `pi-container--${size}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
