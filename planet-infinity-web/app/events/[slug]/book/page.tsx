import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { EventBookingFlow } from "@/components/EventBookingFlow";
import { Section } from "@/components/Section";
import { getEventBySlug } from "@/content/source";

type Params = { params: Promise<{ slug: string }> };

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
export default async function EventBookingPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  if (event.applicationRequired || event.bookingMode === "application") {
    redirect(`/apply?product=${encodeURIComponent(event.id)}&type=event&title=${encodeURIComponent(event.title)}`);
  }

  return (
    <Section tone="ivory" className="pi-world-events">
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
  );
}
