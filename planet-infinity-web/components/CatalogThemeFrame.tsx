import type { CSSProperties, ReactNode } from "react";
import { DEFAULT_CATALOG_THEME, isHexColor, type CatalogVisualTheme } from "@/lib/catalog-visual-theme";
import { isSafeCatalogUrl } from "@/lib/catalog-media";
import { CatalogThemeRuntime } from "@/components/CatalogThemeRuntime";

type ThemeStyle = CSSProperties & {
  "--pi-catalog-primary": string;
  "--pi-catalog-secondary": string;
  "--pi-catalog-image": string;
};

export function CatalogThemeFrame({
  theme,
  kind,
  children,
}: {
  theme?: CatalogVisualTheme;
  kind: "trip" | "event";
  children: ReactNode;
}) {
  const primary = theme?.primaryColor && isHexColor(theme.primaryColor) ? theme.primaryColor : DEFAULT_CATALOG_THEME.primaryColor;
  const secondary = theme?.secondaryColor && isHexColor(theme.secondaryColor) ? theme.secondaryColor : DEFAULT_CATALOG_THEME.secondaryColor;
  const backgroundImage = theme?.backgroundImage && isSafeCatalogUrl(theme.backgroundImage) ? theme.backgroundImage : "";
  const logo = theme?.logo && isSafeCatalogUrl(theme.logo) ? theme.logo : "";
  const style: ThemeStyle = {
    "--pi-catalog-primary": primary,
    "--pi-catalog-secondary": secondary,
    "--pi-catalog-image": backgroundImage ? `url("${backgroundImage.replace(/["\\]/g, "")}")` : "none",
  };

  return (
    <div
      className="pi-catalog-theme"
      data-kind={kind}
      data-surface={theme?.surface ?? DEFAULT_CATALOG_THEME.surface}
      data-finish={theme?.finish ?? DEFAULT_CATALOG_THEME.finish}
      data-background={theme?.background ?? DEFAULT_CATALOG_THEME.background}
      data-depth={theme?.depth ?? DEFAULT_CATALOG_THEME.depth}
      data-typography={theme?.typography ?? DEFAULT_CATALOG_THEME.typography}
      style={style}
    >
      <CatalogThemeRuntime theme={{ ...theme, logo }} />
      {children}
    </div>
  );
}
