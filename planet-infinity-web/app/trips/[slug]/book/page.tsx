import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { TripBookingFlow } from "@/components/TripBookingFlow";
import { allTrips, findTrip } from "@/content/trips";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allTrips().map((trip) => ({ slug: trip.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const trip = findTrip(slug);
  return { title: trip ? `Book — ${trip.title}` : "Booking" };
}

/**
 * The booking flow for one trip. Which steps exist is decided per trip, not
 * per site: selection and seats are independent and both are optional.
 *
 * Nothing here submits, saves or charges anything.
 */
export default async function TripBookingPage({ params }: Params) {
  const { slug } = await params;
  const trip = findTrip(slug);
  if (!trip) notFound();

  return (
    <Section tone="ivory">
      <Container size="read">
        <Breadcrumbs
          trail={[
            { label: "Home", href: "/" },
            { label: "Travel", href: "/trips" },
            { label: trip.title, href: `/trips/${trip.slug}` },
            { label: "Book" },
          ]}
        />
        <h1 className="pi-flow__heading">{trip.title}</h1>
        <TripBookingFlow trip={trip} />
      </Container>
    </Section>
  );
}
