/**
 * Planet Infinity — brand assets.
 *
 * The official artwork lives in public/brand/ and is used as supplied: never
 * recoloured, redrawn, cropped or stretched. Intrinsic dimensions are recorded
 * per file so each mark keeps its own aspect ratio — they are not the same
 * shape as each other.
 *
 *   planet-infinity-orange.png   640 x 641    general · Home · Travel
 *   planet-infinity-violet.png   1427 x 1102  the Events world
 */

export type BrandWorld = "general" | "events";

type LogoAsset = {
  src: string;
  /** Intrinsic pixel size, so next/image never distorts the artwork. */
  width: number;
  height: number;
};

export const LOGOS: Record<BrandWorld, LogoAsset> = {
  general: { src: "/brand/planet-infinity-orange.png", width: 640, height: 641 },
  events: { src: "/brand/planet-infinity-violet.png", width: 1427, height: 1102 },
};

/** Rendered heights. Width follows from each file's own ratio. */
export const LOGO_HEIGHT = { header: 34, hero: 96, footer: 34 } as const;
