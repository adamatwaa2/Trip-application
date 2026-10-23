/** Use the standard Events mark until event-specific transparent artwork is ready. */
export const EVENT_BRAND_LOGOS: Readonly<Record<string, string>> = {};
export function eventBrandLogo(pathname: string): string {
 for (const [slug, logo] of Object.entries(EVENT_BRAND_LOGOS)) {
  const root = "/events/" + slug;
  if (pathname === root || pathname.startsWith(root + "/")) return logo;
 }
 return "";
}
