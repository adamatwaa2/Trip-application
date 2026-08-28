import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Planet Infinity",
    short_name: "Planet Infinity",
    description: "Entertainment, community, curated experiences, events and selected trips in Egypt.",
    start_url: "/",
    display: "standalone",
    background_color: "#d9f3fb",
    theme_color: "#d9f3fb",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
