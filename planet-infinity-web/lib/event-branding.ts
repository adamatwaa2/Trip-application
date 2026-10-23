/** Original event-specific artwork, scoped to these event and checkout routes only.
 * Spooky Haus temporarily uses the site's previous mark until its replacement is transparent.
 */
export const EVENT_BRAND_LOGOS = {
 "halloween-party-2026": "https://dnjeghmqieyqgafwuemj.supabase.co/storage/v1/object/public/catalog-media/615119c8-d40a-450b-8286-ada8f9f4dc88/image/2026-10/67384a3a-cf69-4cc4-91aa-3fe1ff560e8a.jpg",
} as const;
export function eventBrandLogo(pathname: string): string {
 for (const [slug, logo] of Object.entries(EVENT_BRAND_LOGOS)) {
  const root = "/events/" + slug;
  if (pathname === root || pathname.startsWith(root + "/")) return logo;
 }
 return "";
}
