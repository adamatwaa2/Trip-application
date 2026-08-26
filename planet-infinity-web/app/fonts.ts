/**
 * Planet Infinity — typefaces (PI-WB-002, Plate 04)
 *
 * Three families, no fourth family ever:
 *   Clash Display        headlines, 600/700, never below 20px, never Arabic
 *   Plus Jakarta Sans    body, UI, buttons, labels, forms, data
 *   IBM Plex Sans Arabic all Arabic, display through caption
 *
 * Clash Display is loaded from the font embedded in Adam's supplied website
 * brand-guidelines file. Keeping it local avoids a third-party font request
 * and makes the production rendering deterministic.
 */
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import localFont from "next/font/local";

export const clash = localFont({
  src: "./typefaces/ClashDisplay-Bold.woff2",
  variable: "--font-clash",
  weight: "700",
  style: "normal",
  display: "swap",
});

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

export const fontVariables = `${clash.variable} ${jakarta.variable} ${plexArabic.variable}`;
