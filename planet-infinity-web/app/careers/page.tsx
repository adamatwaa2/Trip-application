import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the people building Planet Infinity trips, events and community.",
  alternates: { canonical: "/careers" },
};
export default function CareersPage() { redirect("/join"); }
