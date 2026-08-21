import Link from "next/link";

type BrandLockupProps = {
  /** `ivory` for use on Deep Ink, `ink` for use on light surfaces. */
  tone?: "ink" | "ivory";
  /** Render as a link home. Off inside the footer's own home link. */
  asLink?: boolean;
};

/**
 * Mark + wordmark, the lockup PI-WB-002 uses for itself.
 *
 * The 3D master mark is "used as supplied, never re-rendered or redrawn", and
 * Adam has not supplied the asset yet — so the mark sits as an empty slot with
 * a quiet dashed outline. It is tracked in content/placeholders.ts and shows up
 * in `npm run placeholders`. Nothing is drawn, generated or approximated.
 *
 * When the asset arrives, replace the slot with the supplied image. The
 * wordmark beside it is type, not artwork, and stays as it is.
 */
export function BrandLockup({ tone = "ink", asLink = true }: BrandLockupProps) {
  const content = (
    <>
      <span
        className="pi-brand__mark"
        role="img"
        aria-label="Planet Infinity mark — asset not supplied yet"
        title="3D master mark not supplied yet — used as supplied, never redrawn"
      />
      <span className="pi-brand__word">Planet Infinity</span>
    </>
  );

  const className = `pi-brand pi-brand--${tone}`;

  if (!asLink) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link href="/" className={className}>
      {content}
    </Link>
  );
}
