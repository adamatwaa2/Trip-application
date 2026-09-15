export const CATALOG_SURFACES = ["light", "dark"] as const;
export const CATALOG_FINISHES = ["matte", "soft-metal", "metallic"] as const;
export const CATALOG_BACKGROUNDS = ["clean", "stars", "desert", "sea-blur", "night"] as const;
export const CATALOG_DEPTHS = ["flat", "raised", "three-d"] as const;
export const CATALOG_EXPLORER_MOTIONS = ["still", "gentle", "interactive"] as const;
export const CATALOG_TYPOGRAPHIES = ["brand", "editorial", "rounded", "technical"] as const;
export const CATALOG_CHANNELS = ["trips", "events", "themes"] as const;

export type CatalogSurface = (typeof CATALOG_SURFACES)[number];
export type CatalogFinish = (typeof CATALOG_FINISHES)[number];
export type CatalogBackground = (typeof CATALOG_BACKGROUNDS)[number];
export type CatalogDepth = (typeof CATALOG_DEPTHS)[number];
export type CatalogExplorerMotion = (typeof CATALOG_EXPLORER_MOTIONS)[number];
export type CatalogTypography = (typeof CATALOG_TYPOGRAPHIES)[number];
export type CatalogChannel = (typeof CATALOG_CHANNELS)[number];

export type CatalogVisualTheme = {
  logo?: string;
  logoAlt?: string;
  primaryColor?: string;
  secondaryColor?: string;
  surface?: CatalogSurface;
  finish?: CatalogFinish;
  background?: CatalogBackground;
  backgroundImage?: string;
  depth?: CatalogDepth;
  explorerScale?: number;
  explorerMotion?: CatalogExplorerMotion;
  typography?: CatalogTypography;
  /** Public catalogue sections where this one canonical experience appears. */
  channels?: CatalogChannel[];
};

export const DEFAULT_CATALOG_THEME: Required<Pick<CatalogVisualTheme, "primaryColor" | "secondaryColor" | "surface" | "finish" | "background" | "depth" | "explorerScale" | "explorerMotion" | "typography">> = {
  primaryColor: "#f59b23",
  secondaryColor: "#7bcfd8",
  surface: "light",
  finish: "soft-metal",
  background: "clean",
  depth: "raised",
  explorerScale: 1,
  explorerMotion: "interactive",
  typography: "brand",
};

export function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}
