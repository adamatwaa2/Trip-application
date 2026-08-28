import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AvailabilityPill } from "@/components/AvailabilityPill";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogDocumentCard } from "@/components/CatalogDocumentCard";
import { Container } from "@/components/Container";
import { DemoBadge } from "@/components/DemoBadge";
import { EventBookingModule } from "@/components/EventBookingModule";
import { Eyebrow } from "@/components/Eyebrow";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { MediaBlock } from "@/components/MediaBlock";
import { Section } from "@/components/Section";
import { getEventBySlug } from "@/content/source";
import { getSiteCopy } from "@/lib/site-copy";

type Params = { params: Promise<{ slug: string }> };

// Catalogue items are read from Supabase and use request cookies for SSR auth.
// These pages must render dynamically rather than during the production build.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found", robots: { index: false, follow: false } };
  return {
    title: event.title,
    description: event.shortDescription,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: event.title,
      description: event.shortDescription,
      url: `/events/${event.slug}`,
      images: event.media.hero ? [{ url: event.media.hero, alt: event.media.heroAlt ?? event.title }] : undefined,
    },
  };
}

/**
 * Event detail page.
 *
 * The booking module is the only place that decides how this event is
 * ticketed. There is no ticket picker, no quantity control and no seat map on
 * this page — events have no seat model at all.
 */
export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const [event, copy] = await Promise.all([getEventBySlug(slug), getSiteCopy()]);
  if (!event) notFound();

  const gallery = [
    ...(event.media.hero ? [{ src: event.media.hero, alt: event.media.heroAlt ?? event.title }] : []),
    ...(event.media.gallery ?? []),
  ].filter((image, index, images) => images.findIndex((entry) => entry.src === image.src) === index);

  const facts = [
    ["Category", event.category],
    ["Date", event.eventDate],
    ["Time", event.startTime ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}` : undefined],
    ["Location", event.venue],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <div className="pi-world-events">
      <section className="pi-trip-cinema pi-event-cinema">
        <MediaBlock
          src={event.media.hero}
          videoSrc={event.media.video}
          alt={event.media.heroAlt ?? event.title}
          ratio="21-9"
          radius="none"
          className="pi-trip-cinema__media"
          emptyLabel={event.category}
          eager
        >
          <Container className="pi-trip-cinema__content">
            <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Events", href: "/events" }, { label: event.title }]} />
            <Eyebrow>{event.category}</Eyebrow>
            <h1>{event.title}</h1>
            <p>{event.shortDescription}</p>
          </Container>
        </MediaBlock>
      </section>

      <Section tone="white" className="pi-trip-story">
        <Container>
          {event.isDemo ? <p className="pi-trip-hero__demo"><DemoBadge /> This is an architecture test case, not a real Planet Infinity event.</p> : null}
          <div className="pi-trip-layout">
            <div className="pi-trip-main">
              <section className="pi-trip-block pi-trip-block--intro">
                <Eyebrow>Event story</Eyebrow>
                <h2>{copy.event_overview_title}</h2>
                {event.description.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </section>

              {gallery.length ? (
                <section className="pi-trip-block pi-trip-block--gallery">
                  <div className="pi-trip-block__head"><div><Eyebrow>Photography</Eyebrow><h2>{copy.event_gallery_title}</h2></div><p>{copy.trip_gallery_hint}</p></div>
                  <GalleryLightbox images={gallery} />
                </section>
              ) : null}

              {facts.length || event.availability ? (
                <section className="pi-trip-block">
                  <Eyebrow>At a glance</Eyebrow>
                  <h2>{copy.trip_details_title}</h2>
                  <dl className="pi-trip-facts">
                    {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                    {event.availability ? <div><dt>Availability</dt><dd><AvailabilityPill state={event.availability} /></dd></div> : null}
                  </dl>
                </section>
              ) : null}

              {event.document ? (
                <section className="pi-trip-block">
                  <h2>{copy.event_document_title}</h2>
                  <CatalogDocumentCard
                    url={event.document.url}
                    label={event.document.label}
                    kind="event"
                  />
                </section>
              ) : null}

              {event.whatIsIncluded?.length || event.whatIsNotIncluded?.length ? (
                <section className="pi-trip-block">
                  <h2>{copy.trip_included_title}</h2>
                  <div className="pi-includes">
                    <ul className="pi-includes__list pi-includes__list--in">
                      {event.whatIsIncluded?.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div>
                      <h3 className="pi-includes__subtitle">{copy.trip_not_included_title}</h3>
                      <ul className="pi-includes__list pi-includes__list--out">
                        {event.whatIsNotIncluded?.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              ) : null}

              {event.importantInformation?.length ? (
                <section className="pi-trip-block">
                  <h2>{copy.event_information_title}</h2>
                  <ul className="pi-notes">
                    {event.importantInformation.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {event.faq?.length ? (
                <section className="pi-trip-block">
                  <h2>{copy.event_questions_title}</h2>
                  <div className="pi-faq">
                    {event.faq.map((item) => (
                      <details key={item.question}>
                        <summary>{item.question}</summary>
                        <p>{item.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="pi-trip-block">
                <h2>{copy.event_cancellation_title}</h2>
                <p className="pi-trip-block__body">
                  {event.cancellationSummary ??
                    "Cancellation terms are set per event and shared in writing before any payment is made."}
                </p>
              </section>
            </div>

            <div className="pi-trip-aside">
              <EventBookingModule event={event} />
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
