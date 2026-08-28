import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Planet Infinity",
    short_name: "Planet Infinity",
    description: "Trips, experiences and events across Egypt.",
    start_url: "/",
    display: "standalone",
    background_color: "#d9f3fb",
    theme_color: "#d9f3fb",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
