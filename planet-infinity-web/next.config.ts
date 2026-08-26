import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const supabaseHostnames = new Set(["dnjeghmqieyqgafwuemj.supabase.co"]);
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabaseHostnames.add(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname);
  }
} catch {
  // The runtime environment validator reports a clearer error for invalid URLs.
}

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: Array.from(supabaseHostnames).flatMap((hostname) => [
      {
        protocol: "https" as const,
        hostname,
        pathname: "/storage/v1/object/public/catalog-media/**",
      },
      {
        protocol: "https" as const,
        hostname,
        pathname: "/storage/v1/object/sign/payment-proofs/**",
      },
    ]),
  },
};

export default nextConfig;
