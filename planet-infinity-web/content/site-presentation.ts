import { SITE_DESCRIPTION } from "./brand";
import { WORLD_NAV, PLAN_LINKS, COMPANY_LINKS, POLICY_LINKS } from "./nav";

export type FooterItem = { label: string; href: string; soon: boolean; visible: boolean };
export type FooterColumn = { title: string; items: FooterItem[] };
export type SitePresentation = {
  version: 1;
  seoTitle: string; seoDescription: string; shareImage: string;
  headerLogo: string; eventLogo: string; footerLogo: string;
  instagram: string; footerBrand: string; footerContactTitle: string;
  appTitle: string; appDescription: string; showApp: boolean; showHomePlan: boolean;
  columns: FooterColumn[];
  pageSeo: Array<{ path: string; title: string; description: string }>;
};

export const PRESENTATION_KEY = "site_presentation_v1";
export const PRESENTATION_DEFAULTS: SitePresentation = {
  version: 1, seoTitle: "Planet Infinity Entertainment | Trips & Events", seoDescription: SITE_DESCRIPTION,
  shareImage: "/opengraph-image?brand=20260829", headerLogo: "", eventLogo: "", footerLogo: "",
  instagram: "https://www.instagram.com/planetinfinity.ent/", footerBrand: "Planet Infinity Entertainment",
  footerContactTitle: "Talk to us", appTitle: "The Planet Infinity app.",
  appDescription: "Coming soon. Updates will be announced here.", showApp: true, showHomePlan: true,
  pageSeo: ["/trips", "/events", "/themes", "/explore", "/contact", "/requests"].map(path => ({ path, title: "", description: "" })),
  columns: [
    { title: "Worlds", items: WORLD_NAV.map(item => ({ ...item, soon: false, visible: true })) },
    { title: "Plan", items: [
      ...PLAN_LINKS.filter(item => item.href !== "/apply").map(item => ({ ...item, soon: false, visible: true })),
    ] },
    { title: "Company", items: COMPANY_LINKS.map(item => ({ ...item, soon: false, visible: true })) },
    { title: "Coming soon", items: ["App", "V-hubs", "V-houses", "Merch"].map(label => ({ label, href: "", soon: true, visible: true })) },
    { title: "Policies", items: POLICY_LINKS.map(item => ({ ...item, soon: false, visible: true })) },
  ],
};

// Never accept executable, protocol-relative or control-character URLs from CMS content.
export function safePublicLink(value: string, image = false): boolean {
  if (!value || /[\s\\\u0000-\u001f]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && (!image || /\.(png|jpe?g|webp|avif)(\?.*)?$/i.test(value)); } catch { return false; }
}

export function validatePresentation(value: unknown): value is SitePresentation {
  if (!value || typeof value !== "object") return false;
  const v = value as SitePresentation;
  if (v.version !== 1 || typeof v.showApp !== "boolean" || typeof v.showHomePlan !== "boolean") return false;
  for (const key of ["seoTitle", "seoDescription", "shareImage", "headerLogo", "eventLogo", "footerLogo", "instagram", "footerBrand", "footerContactTitle", "appTitle", "appDescription"] as const) {
    if (typeof v[key] !== "string" || v[key].length > (key === "seoDescription" || key === "appDescription" ? 600 : 500)) return false;
  }
  if (!v.seoTitle.trim() || !v.seoDescription.trim() || !safePublicLink(v.instagram)) return false;
  const pagePaths = ["/trips", "/events", "/themes", "/explore", "/contact", "/requests"];
  if (!Array.isArray(v.pageSeo) || v.pageSeo.length !== pagePaths.length || new Set(v.pageSeo.map(page => page?.path)).size !== pagePaths.length || !v.pageSeo.every(page => page && pagePaths.includes(page.path) && typeof page.title === "string" && page.title.length <= 160 && typeof page.description === "string" && page.description.length <= 600)) return false;
  for (const key of ["shareImage", "headerLogo", "eventLogo", "footerLogo"] as const) if (v[key] && !safePublicLink(v[key], true)) return false;
  return Array.isArray(v.columns) && v.columns.length <= 8 && v.columns.every(column => column && typeof column.title === "string" && column.title.trim().length > 0 && column.title.length <= 80 && Array.isArray(column.items) && column.items.length <= 16 && column.items.every(item => item && typeof item.label === "string" && item.label.trim().length > 0 && item.label.length <= 100 && typeof item.soon === "boolean" && typeof item.visible === "boolean" && typeof item.href === "string" && item.href.length <= 500 && (item.soon ? !item.href || safePublicLink(item.href) : safePublicLink(item.href))));
}
