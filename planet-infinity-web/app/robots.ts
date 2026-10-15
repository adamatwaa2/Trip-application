import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Transactional pages remain crawlable so their noindex can be read.
      disallow: ["/admin", "/api/", "/auth/"],
    },
    sitemap: "https://planetinfinity.online/sitemap.xml",
    host: "https://planetinfinity.online",
  };
}
