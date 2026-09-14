import type { Metadata } from "next";
import Link from "next/link";
import { CareersApplicationForm } from "@/components/CareersApplicationForm";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the people building Planet Infinity trips, events and community.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return <main className="pi-careers-page">
    <header className="pi-careers-mast"><div><p>Planet Infinity · Careers</p><h1>Join the story</h1><h2>We&apos;re looking for characters, not employees.</h2><p>We don&apos;t hire CVs. We hire people — the ones with a bit of soul, who make a bus of strangers feel like a family by hour two. Tell us who you are, what you&apos;re good at, and how you move through the world. Experience helps. Personality decides.</p></div></header>
    <CareersApplicationForm />
    <aside className="pi-careers-trip-link">Looking for a seat on a trip instead? <Link href="/apply">Send a trip request →</Link></aside>
  </main>;
}
