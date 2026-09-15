import type { Metadata } from "next";
import Link from "next/link";
import { CareersApplicationForm } from "@/components/CareersApplicationForm";
import { getSiteCopy } from "@/lib/site-copy";
import { getCareersFormFields } from "@/lib/careers-form";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the people building Planet Infinity trips, events and community.",
  alternates: { canonical: "/careers" },
};

export default async function CareersPage() {
  const [copy, fields] = await Promise.all([getSiteCopy(), getCareersFormFields()]);
  return <main className="pi-careers-page">
    <header className="pi-careers-mast"><div><p>{copy.careers_eyebrow}</p><h1>{copy.careers_title}</h1><h2>{copy.careers_subtitle}</h2><p>{copy.careers_lede}</p></div></header>
    <CareersApplicationForm fields={fields} />
    <aside className="pi-careers-trip-link">Looking for a seat on a trip instead? <Link href="/apply">Send a trip request →</Link></aside>
  </main>;
}
