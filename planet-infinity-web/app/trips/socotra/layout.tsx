import type { ReactNode } from "react";
import { CatalogThemeFrame } from "@/components/CatalogThemeFrame";
import { SocotraTheme } from "@/components/SocotraTheme";
import "./socotra.css";
export default function SocotraLayout({ children }: { children: ReactNode }) {
  return <div className="pi-socotra"><SocotraTheme /><CatalogThemeFrame kind="trip" theme={{ primaryColor: "#73cfe4", secondaryColor: "#eee8db", surface: "light", background: "clean", finish: "soft-metal", depth: "raised", typography: "brand" }}>{children}</CatalogThemeFrame></div>;
}
