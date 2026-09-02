import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { fontVariables } from "./fonts";
import "./globals.css";

const META_PIXEL_ID = "2084127045560120";

const META_PIXEL_BOOTSTRAP = `
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${META_PIXEL_ID}');
  fbq('track', 'PageView');
  window.dispatchEvent(new Event('meta-pixel-ready'));
`;

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
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/icon", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "512x512" }],
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
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    /* English-first. Arabic + RTL later: this becomes lang="ar" dir="rtl" and
       the layout flips with it — no component rewrites needed. */
    <html lang="en" dir="ltr" className={fontVariables}>
      <body>
        <Script id="meta-pixel" strategy="afterInteractive">
          {META_PIXEL_BOOTSTRAP}
        </Script>
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
