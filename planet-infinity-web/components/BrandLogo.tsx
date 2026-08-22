import Image from "next/image";
import {
  BRAND_LOGOS_INSTALLED,
  LOGO_FILES,
  type BrandWorld,
} from "@/content/brand";

type BrandLogoProps = {
  /** `events` uses the violet mark; everything else uses the orange one. */
  world?: BrandWorld;
  size?: number;
  className?: string;
};

/**
 * The Planet Infinity mark.
 *
 * Renders the supplied artwork as-is: no recolouring, no redrawing, no filter
 * or effect over it, and the square aspect ratio is preserved so it cannot be
 * distorted at any breakpoint.
 *
 * While the files are missing it renders NOTHING rather than a stand-in — no
 * circle, no letter, no generated substitute. The wordmark beside it carries
 * the brand until the real mark arrives. See content/brand.ts to install.
 */
export function BrandLogo({
  world = "general",
  size = 34,
  className,
}: BrandLogoProps) {
  if (!BRAND_LOGOS_INSTALLED) return null;

  return (
    <Image
      src={LOGO_FILES[world]}
      alt="Planet Infinity"
      width={size}
      height={size}
      priority
      className={["pi-logo", className].filter(Boolean).join(" ")}
    />
  );
}
