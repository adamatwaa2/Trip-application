import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://planetinfinity.online"),
  applicationName: "Planet Infinity",
  title: {
    default: "Planet Infinity | Entertainment, Community & Experiences",
    template: "%s — Planet Infinity",
  },
  description:
    "Planet Infinity is an entertainment and community platform for curated gatherings, events, experiences and selected trips in Egypt.",
  keywords: [
    "Planet Infinity",
    "Planet Infinity Egypt",
    "Egypt entertainment",
    "community experiences Egypt",
    "curated events Egypt",
    "Planet Infinity community",
    "Wadi El Hitan experience",
  ],
  authors: [{ name: "Planet Infinity Entertainment", url: "https://planetinfinity.online" }],
  creator: "Planet Infinity Entertainment",
  publisher: "Planet Infinity Entertainment",
  category: "entertainment",
  icons: {
    icon: [{ url: "/icon?brand=20260829", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon?brand=20260829", type: "image/png", sizes: "512x512" }],
  },
  openGraph: {
    title: "Planet Infinity | Entertainment, Community & Experiences",
    description: "An entertainment and community platform for curated gatherings, events, experiences and selected trips in Egypt.",
    siteName: "Planet Infinity",
    locale: "en_EG",
    type: "website",
    url: "https://planetinfinity.online",
    images: [{ url: "/opengraph-image?brand=20260829", width: 1200, height: 630, alt: "Planet Infinity — entertainment, community and experiences" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Planet Infinity | Entertainment, Community & Experiences",
    description: "An entertainment and community platform for curated gatherings, events, experiences and selected trips in Egypt.",
    images: ["/opengraph-image?brand=20260829"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    /* English-first. Arabic + RTL later: this becomes lang="ar" dir="rtl" and
       the layout flips with it — no component rewrites needed. */
    <html lang="en" dir="ltr" className={fontVariables}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://planetinfinity.online/#organization",
                  name: "Planet Infinity",
                  alternateName: "Planet Infinity Entertainment",
                  legalName: "V Topia Estates Realty",
                  description: "Planet Infinity is an entertainment and community platform for curated gatherings, cultural moments, events, experiences and selected trips in Egypt.",
                  url: "https://planetinfinity.online/",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://planetinfinity.online/icon",
                    contentUrl: "https://planetinfinity.online/icon",
                    width: 512,
                    height: 512,
                  },
                  telephone: "+20 103 729 9464",
                  contactPoint: {
                    "@type": "ContactPoint",
                    telephone: "+20 103 729 9464",
                    contactType: "customer service",
                    availableLanguage: ["Arabic", "English"],
                  },
                  sameAs: ["https://www.instagram.com/planetinfinity.ent/"],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://planetinfinity.online/#website",
                  url: "https://planetinfinity.online/",
                  name: "Planet Infinity",
                  publisher: { "@id": "https://planetinfinity.online/#organization" },
                  inLanguage: "en-EG",
                },
              ],
            }).replace(/</g, "\\u003c"),
          }}
        />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
