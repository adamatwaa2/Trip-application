import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { TripBookingFlow } from "@/components/TripBookingFlow";
import { getTripBySlug } from "@/content/source";

type Params = { params: Promise<{ slug: string }> };

// The trip catalogue is operational data, so booking pages are rendered on
// demand and never call cookies() during generateStaticParams at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
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
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();
  if (trip.applicationRequired || trip.bookingMode === "application") {
    redirect(`/apply?product=${encodeURIComponent(trip.id)}&type=trip&title=${encodeURIComponent(trip.title)}`);
  }

  return (
    <Section tone="ivory">
      <Container>
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
