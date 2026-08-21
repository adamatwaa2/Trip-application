/**
 * Planet Infinity — typefaces (PI-WB-002, Plate 04)
 *
 * Three families, no fourth family ever:
 *   Clash Display        headlines, 600/700, never below 20px, never Arabic
 *   Plus Jakarta Sans    body, UI, buttons, labels, forms, data
 *   IBM Plex Sans Arabic all Arabic, display through caption
 *
 * Clash Display is NOT loaded yet. Licensing verification is pending (the
 * primary source is unreachable from this environment — see CLAUDE.md), and
 * no display face is substituted without Adam's approval. Until then display
 * type resolves to Plus Jakarta Sans, which is the fallback PI-WB-002 itself
 * specifies inside --pi-display.
 *
 * To add Clash Display once approved: drop the licensed woff2 files into
 * app/fonts/, declare them with next/font/local here, and export the variable.
 * Nothing else in the codebase needs to change.
 */
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";

export const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

/**
 * Loaded now so the Arabic build is a content change later, not a font change.
 * No Arabic UI ships yet — English-first.
 */
export const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const fontVariables = `${jakarta.variable} ${plexArabic.variable}`;
