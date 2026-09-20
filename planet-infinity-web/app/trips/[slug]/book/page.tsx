import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { TripBookingFlow } from "@/components/TripBookingFlow";
import { CatalogThemeFrame } from "@/components/CatalogThemeFrame";
import { getTripBySlug } from "@/content/source";
import { isPaymobConfigured, isPaymobWalletConfigured } from "@/lib/paymob/config";

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
 * Whether card and wallet payment are offered is decided here, by the server,
 * because the Paymob credentials are server-only.
 */
export default async function TripBookingPage({ params }: Params) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();
  if (trip.applicationRequired || trip.bookingMode === "application") {
    redirect(`/apply?product=${encodeURIComponent(trip.id)}&type=trip&title=${encodeURIComponent(trip.title)}`);
  }

  return (
    <CatalogThemeFrame theme={trip.media.visualTheme} kind="trip">
      <Section tone="white" className="pi-catalog-booking">
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
        {/*
          A trip that still demands a receipt is manual-only: the booking RPC
          rejects a booking without one, so online payment is not offered for it.
        */}
        <TripBookingFlow
          trip={trip}
          paymobCardEnabled={!trip.paymentProofRequired && isPaymobConfigured()}
          paymobWalletEnabled={!trip.paymentProofRequired && isPaymobWalletConfigured()}
        />
        </Container>
      </Section>
    </CatalogThemeFrame>
  );
}

