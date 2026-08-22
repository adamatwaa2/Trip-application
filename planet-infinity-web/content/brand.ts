/**
 * Planet Infinity — brand assets.
 *
 * ── THE SUPPLIED LOGOS ARE NOT IN THE REPOSITORY YET ─────────────────────
 * Adam attached two logo images to the brief, but they arrived as images in
 * the conversation rather than as files, so there is nothing on disk to
 * install. Nothing has been redrawn, recoloured or generated as a substitute:
 * until the real files land, the header and footer show the wordmark alone.
 *
 * TO INSTALL THEM — drop the two files in and flip one flag:
 *   public/brand/planet-infinity-orange.png    general · Home · Travel
 *   public/brand/planet-infinity-violet.png    the Events world
 *   then set BRAND_LOGOS_INSTALLED to true below.
 *
 * PNG with transparency is expected; SVG works too — change LOGO_FILES below
 * to match the extension. Nothing else in the codebase needs touching: every
 * placement, size and responsive rule is already built around them.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Flip to true once both files exist in public/brand/. */
export const BRAND_LOGOS_INSTALLED = false;

export type BrandWorld = "general" | "events";

export const LOGO_FILES: Record<BrandWorld, string> = {
  general: "/brand/planet-infinity-orange.png",
  events: "/brand/planet-infinity-violet.png",
};

/**
 * Intrinsic size the logo is rendered at. The supplied artwork is square, so
 * these keep the aspect ratio locked — the mark is never stretched.
 */
export const LOGO_RENDER_SIZE = { header: 34, hero: 96, footer: 34 } as const;
