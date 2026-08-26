import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AvailabilityPill } from "@/components/AvailabilityPill";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogDocumentCard } from "@/components/CatalogDocumentCard";
import { Container } from "@/components/Container";
import { DemoBadge } from "@/components/DemoBadge";
import { Eyebrow } from "@/components/Eyebrow";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { MediaBlock } from "@/components/MediaBlock";
import { Section } from "@/components/Section";
import { TripBookingModule } from "@/components/TripBookingModule";
import { getTripBySlug } from "@/content/source";
import { getSiteCopy } from "@/lib/site-copy";

type Params = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) return { title: "Trip not found" };
  return { title: trip.title, description: trip.shortDescription };
}

export default async function TripPage({ params }: Params) {
  const { slug } = await params;
  const [trip, copy] = await Promise.all([getTripBySlug(slug), getSiteCopy()]);
  if (!trip) notFound();

  const gallery = [
    ...(trip.media.hero ? [{ src: trip.media.hero, alt: trip.media.heroAlt ?? trip.title }] : []),
    ...(trip.media.gallery ?? []),
  ].filter((image, index, images) => images.findIndex((entry) => entry.src === image.src) === index);

  const facts = [
    ["Destination", trip.destination],
    ["Duration", trip.duration],
    ["Meeting point", trip.meetingPoint],
    ["Departure", trip.departureTime],
    ["Return", trip.returnTime],
    ["Departure point", trip.departurePoint],
    ["Return point", trip.returnPoint],
    ["Package", trip.packageLabel],
    ["Accommodation", trip.accommodation],
    ["Transportation", trip.transportation],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <>
      <section className="pi-trip-cinema">
        <MediaBlock
          src={trip.media.hero}
          videoSrc={trip.media.video}
          alt={trip.media.heroAlt ?? trip.title}
          ratio="21-9"
          radius="none"
          className="pi-trip-cinema__media"
          emptyLabel={trip.destination}
          eager
        >
          <Container className="pi-trip-cinema__content">
            <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Travel", href: "/trips" }, { label: trip.title }]} />
            <Eyebrow>{trip.destination}</Eyebrow>
            <h1>{trip.title}</h1>
            <p>{trip.shortDescription}</p>
          </Container>
        </MediaBlock>
      </section>

      <Section tone="white" className="pi-trip-story">
        <Container>
          {trip.isDemo ? <p className="pi-trip-hero__demo"><DemoBadge /> This is an architecture test case, not a real Planet Infinity trip.</p> : null}
          <div className="pi-trip-layout">
            <div className="pi-trip-main">
              <section className="pi-trip-block pi-trip-block--intro">
                <Eyebrow>Trip story</Eyebrow>
                <h2>{copy.trip_overview_title}</h2>
                {trip.description.map((paragraph) => <p key={paragraph.slice(0, 32)}>{paragraph}</p>)}
              </section>

              {gallery.length ? (
                <section className="pi-trip-block pi-trip-block--gallery">
                  <div className="pi-trip-block__head"><div><Eyebrow>Photography</Eyebrow><h2>{copy.trip_gallery_title}</h2></div><p>{copy.trip_gallery_hint}</p></div>
                  <GalleryLightbox images={gallery} />
                </section>
              ) : null}

              {facts.length ? (
                <section className="pi-trip-block">
                  <Eyebrow>At a glance</Eyebrow>
                  <h2>{copy.trip_details_title}</h2>
                  <dl className="pi-trip-facts">
                    {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                    {trip.availability ? <div><dt>Availability</dt><dd><AvailabilityPill state={trip.availability} /></dd></div> : null}
                  </dl>
                </section>
              ) : null}

              {trip.document ? <section className="pi-trip-block"><h2>{copy.trip_document_title}</h2><CatalogDocumentCard url={trip.document.url} label={trip.document.label} kind="trip" /></section> : null}

              {trip.included?.length || trip.notIncluded?.length ? (
                <section className="pi-trip-block"><h2>{copy.trip_included_title}</h2><div className="pi-includes"><ul className="pi-includes__list pi-includes__list--in">{trip.included?.map((item) => <li key={item}>{item}</li>)}</ul><div><h3 className="pi-includes__subtitle">{copy.trip_not_included_title}</h3><ul className="pi-includes__list pi-includes__list--out">{trip.notIncluded?.map((item) => <li key={item}>{item}</li>)}</ul></div></div></section>
              ) : null}

              {trip.itinerary?.length ? <section className="pi-trip-block"><h2>{copy.trip_itinerary_title}</h2><ol className="pi-itinerary">{trip.itinerary.map((stop) => <li key={stop.label}><p className="pi-itinerary__label">{stop.label}</p><h3 className="pi-itinerary__title">{stop.title}</h3><p className="pi-itinerary__body">{stop.body}</p></li>)}</ol></section> : null}

              {trip.importantInformation?.length ? <section className="pi-trip-block"><h2>{copy.trip_information_title}</h2><ul className="pi-notes">{trip.importantInformation.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}

              {trip.faq?.length ? <section className="pi-trip-block"><h2>{copy.trip_questions_title}</h2><div className="pi-faq">{trip.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section> : null}

              <section className="pi-trip-block"><h2>{copy.trip_cancellation_title}</h2><p className="pi-trip-block__body">{trip.cancellationSummary ?? "Cancellation terms are set per trip and shared in writing before any payment is made."}</p></section>
            </div>

            <aside className="pi-trip-aside" aria-label="Booking options"><TripBookingModule trip={trip} /></aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
