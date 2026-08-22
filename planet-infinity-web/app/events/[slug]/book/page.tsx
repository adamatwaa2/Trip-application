import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { EventBookingFlow } from "@/components/EventBookingFlow";
import { Section } from "@/components/Section";
import { allEvents, findEvent } from "@/content/events";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allEvents().map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = findEvent(slug);
  return { title: event ? `Book — ${event.title}` : "Booking" };
}

/**
 * The booking flow for one event. Which steps exist is decided per event:
 * ticket selection and quantity are independent and both optional, and a
 * curated event is a single request instead of a checkout.
 *
 * Nothing submits, saves, emails or charges.
 */
export default async function EventBookingPage({ params }: Params) {
  const { slug } = await params;
  const event = findEvent(slug);
  if (!event) notFound();

  return (
    <Section tone="ivory">
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
