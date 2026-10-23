import Link from "next/link";
import Image from "next/image";
import type { BrandWorld } from "@/content/brand";
import { BrandLogo } from "./BrandLogo";

type BrandLockupProps = {
  logoOverride?: string;
  /** Ivory on Deep Ink, ink on light surfaces. */
  tone?: "ink" | "ivory";
  /** `events` swaps the orange mark for the violet one. */
  world?: BrandWorld;
  /** Rendered logo height. */
  height?: number;
  asLink?: boolean;
};

/**
 * Mark + wordmark, the lockup PI-WB-002 uses for itself.
 *
 * The mark is the supplied artwork (see components/BrandLogo), paired with
 * the wordmark — the same lockup PI-WB-002 uses for itself.
 */
export function BrandLockup({
  tone = "ink",
  world = "general",
  height = 34,
  asLink = true,
  logoOverride,
}: BrandLockupProps) {
  const content = (
    <>
      <span className="pi-brand__logo-slot" data-brand-logo-slot style={logoOverride && height === 44 ? { width: 44, height: 44, flex: "0 0 44px" } : undefined}>
        {logoOverride ? <Image src={logoOverride} alt="Planet Infinity" width={160} height={height} unoptimized style={{ width: "auto", height, objectFit: "contain", maxWidth: 160 }} /> : <BrandLogo world={world} height={height} priority />}
      </span>
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

