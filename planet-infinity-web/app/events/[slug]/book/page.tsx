import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { EventBookingFlow } from "@/components/EventBookingFlow";
import { Section } from "@/components/Section";
import { getEventBySlug } from "@/content/source";
import { CatalogThemeFrame } from "@/components/CatalogThemeFrame";
import { HalloweenBookingFlow } from "@/components/HalloweenBookingFlow";
import { HALLOWEEN_SLUG } from "@/content/events/halloween";
import { halloweenAppearance } from "@/lib/halloween-appearance";
import { getSiteCopy } from "@/lib/site-copy";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import "@/app/halloween.css";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ look?: string }> };

// The event catalogue is operational data, so booking pages are rendered on
// demand and never call cookies() during generateStaticParams at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return { title: event ? `Book — ${event.title}` : "Booking" };
}

/**
 * The booking flow for one event. Which steps exist is decided per event:
 * ticket selection and quantity are independent and both optional, and a
 * curated event is a single request instead of a checkout.
 *
 * The final step saves a request. It does not charge or confirm attendance.
 */
export default async function EventBookingPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  if (event.media.linkedTripSlug) redirect(`/trips/${event.media.linkedTripSlug}/book`);
  if (event.slug === HALLOWEEN_SLUG) {
    const appearance = halloweenAppearance((await searchParams).look);
    const copy = await getSiteCopy();
    return <HalloweenBookingFlow event={event} appearance={appearance} whatsapp={copy.contact_whatsapp} preview={process.env.NODE_ENV === "development" && !isSupabaseConfigured()} />;
  }
  if (event.applicationRequired || event.bookingMode === "application") {
    redirect(`/apply?product=${encodeURIComponent(event.id)}&type=event&title=${encodeURIComponent(event.title)}`);
  }

  return (
    <CatalogThemeFrame theme={event.media.visualTheme} kind="event">
      <Section tone="white" className="pi-world-events pi-catalog-booking">
        <Container size="read">
        <Breadcrumbs
          trail={[
            { label: "Home", href: "/" },
            { label: "Events", href: "/events" },
            { label: event.title, href: `/events/${event.slug}` },
            { label: "Book" },
          ]}
        />
        <h1 className="pi-flow__heading">{event.title}</h1>
        <EventBookingFlow event={event} />
        </Container>
      </Section>
    </CatalogThemeFrame>
  );
}
