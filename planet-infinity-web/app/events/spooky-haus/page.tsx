import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/content/source";
import { SpookyHausPage } from "@/components/SpookyHausPage";
import "@/app/spooky-haus.css";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const event = await getEventBySlug("spooky-haus");
  return { title: event?.title ?? "Spooky Haus", description: event?.shortDescription, alternates: { canonical: "/events/spooky-haus" }, openGraph: { images: event?.media.hero ? [{ url: event.media.hero, alt: event.title }] : [] } };
}
export default async function Page() {
  const event = await getEventBySlug("spooky-haus");
  if (!event) notFound();
  return <SpookyHausPage event={event} />;
}
