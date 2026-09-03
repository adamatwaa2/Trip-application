import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /careers is a client component, so its metadata lives here.
 * This is the hiring flow — people who want to work with us. It is a
 * different thing entirely from /apply, which is a guest asking for a seat.
 */
export const metadata: Metadata = {
  title: "Careers — join the story",
  description:
    "Planet Infinity is hiring characters, not CVs. Tell us who you are and how you move through the world.",
  alternates: { canonical: "/careers" },
};

export default function CareersLayout({ children }: { children: ReactNode }) {
  return children;
}
