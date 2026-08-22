import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://planetinfinity.online"),
  title: {
    default: "Planet Infinity",
    template: "%s — Planet Infinity",
  },
  description:
    "Planet Infinity Entertainment — trips and events out of Dahab, South Sinai.",
  openGraph: {
    siteName: "Planet Infinity",
    locale: "en",
    type: "website",
    url: "https://planetinfinity.online",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    /* English-first. Arabic + RTL later: this becomes lang="ar" dir="rtl" and
       the layout flips with it — no component rewrites needed. */
    <html lang="en" dir="ltr" className={fontVariables}>
      <body>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
