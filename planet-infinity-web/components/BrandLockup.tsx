import Link from "next/link";
import type { BrandWorld } from "@/content/brand";
import { BrandLogo } from "./BrandLogo";

type BrandLockupProps = {
  /** Ivory on Deep Ink, ink on light surfaces. */
  tone?: "ink" | "ivory";
  /** `events` swaps the orange mark for the violet one. */
  world?: BrandWorld;
  size?: number;
  asLink?: boolean;
};

/**
 * Mark + wordmark, the lockup PI-WB-002 uses for itself.
 *
 * The mark comes from the supplied artwork (see components/BrandLogo). Until
 * those files are installed the lockup is the wordmark alone — deliberately
 * no placeholder circle, no generic glyph, no substitute.
 */
export function BrandLockup({
  tone = "ink",
  world = "general",
  size = 34,
  asLink = true,
}: BrandLockupProps) {
  const content = (
    <>
      <BrandLogo world={world} size={size} />
      <span className="pi-brand__word">Planet Infinity</span>
    </>
  );

  const className = `pi-brand pi-brand--${tone}`;

  if (!asLink) return <span className={className}>{content}</span>;

  return (
    <Link href="/" className={className} aria-label="Planet Infinity — home">
      {content}
    </Link>
  );
}
