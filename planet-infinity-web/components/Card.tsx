import Link from "next/link";
import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  /** The whole card is the link — never a "Learn more" (PI-WB-002, Plate 06). */
  href?: string;
  className?: string;
};

/** Base card surface: white, radius 24, hairline, no border on media. */
export function Card({ children, href, className }: CardProps) {
  const classNames = ["pi-card", href ? "pi-card--link" : null, className]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {children}
      </Link>
    );
  }

  return <article className={classNames}>{children}</article>;
}
