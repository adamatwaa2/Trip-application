import Image from "next/image";
import { LOGOS, type BrandWorld } from "@/content/brand";

type BrandLogoProps = {
  /** `events` uses the violet mark; everything else uses the orange one. */
  world?: BrandWorld;
  /** Rendered height in pixels. Width follows the artwork's own ratio. */
  height?: number;
  priority?: boolean;
  className?: string;
};

/**
 * The Planet Infinity mark — the supplied artwork, rendered as-is.
 *
 * No recolouring, no redrawing, no filters over it. Each file carries its own
 * intrinsic dimensions, so the two marks keep their own aspect ratios and
 * neither is stretched to match the other.
 */
export function BrandLogo({
  world = "general",
  height = 34,
  priority = false,
  className,
}: BrandLogoProps) {
  const logo = LOGOS[world];
  const width = Math.round((logo.width / logo.height) * height);

  return (
    <Image
      src={logo.src}
      alt="Planet Infinity"
      width={width}
      height={height}
      priority={priority}
      className={["pi-logo", className].filter(Boolean).join(" ")}
      style={{ height, width: "auto" }}
    />
  );
}
