import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /apply is a client component, so its metadata lives here.
 * Some trips use an application model rather than a booking or request one;
 * this is that flow, not the site's universal booking path.
 */
export const metadata: Metadata = {
  title: "Apply to join",
  description:
    "Tell us who you are before we lock a seat. Planet Infinity reviews every application and replies.",
  robots: { index: false, follow: false },
};

export default function ApplyLayout({ children }: { children: ReactNode }) {
  return children;
}
