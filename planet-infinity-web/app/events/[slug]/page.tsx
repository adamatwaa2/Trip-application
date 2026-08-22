import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AvailabilityPill } from "@/components/AvailabilityPill";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { DemoBadge } from "@/components/DemoBadge";
import { EventBookingModule } from "@/components/EventBookingModule";
import { Eyebrow } from "@/components/Eyebrow";
import { MediaBlock } from "@/components/MediaBlock";
import { Placeholder } from "@/components/Placeholder";
import { Section } from "@/components/Section";
import { getEventBySlug, getEventSlugs } from "@/content/source";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getEventSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return { title: event.title, description: event.shortDescription };
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
  const event = getEventBySlug(slug);
  if (!event) notFound();

  return (
    <div className="pi-world-events">
      <Section tone="ivory" className="pi-trip-hero">
        <Container>
          <Breadcrumbs
            trail={[
              { label: "Home", href: "/" },
              { label: "Events", href: "/events" },
              { label: event.title },
            ]}
          />
          <Eyebrow>{event.category}</Eyebrow>
          <h1 className="pi-trip-hero__title">{event.title}</h1>
          <p className="pi-trip-hero__lede">{event.shortDescription}</p>

          <div className="pi-trip-facts">
            <div>
              <dt>Category</dt>
              <dd>{event.category}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{event.eventDate ?? <Placeholder id="eventDate" label="Not set" />}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>
                {event.startTime ? (
                  `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}`
                ) : (
                  <Placeholder id="eventTime" label="Not set" />
                )}
              </dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{event.venue ?? <Placeholder id="eventVenue" label="Not set" />}</dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>
                {event.availability ? (
                  <AvailabilityPill state={event.availability} />
                ) : (
                  <Placeholder id="availability" label="Not set" />
                )}
              </dd>
            </div>
          </div>

          {event.isDemo ? (
            <p className="pi-trip-hero__demo">
              <DemoBadge /> This is an architecture test case, not a real
              Planet Infinity event. It carries no price, date, time or venue —
              everything operational shows as a placeholder.
            </p>
          ) : null}

          <div className="pi-trip-hero__media">
            <MediaBlock
              src={event.media.hero}
              alt={event.media.heroAlt ?? ""}
              ratio="21-9"
              radius="hero"
            />
          </div>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <div className="pi-trip-layout">
            <div className="pi-trip-main">
              <section className="pi-trip-block">
                <h2>About the night</h2>
                {event.description.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </section>

              {event.whatIsIncluded?.length || event.whatIsNotIncluded?.length ? (
                <section className="pi-trip-block">
                  <h2>What is included</h2>
                  <div className="pi-includes">
                    <ul className="pi-includes__list pi-includes__list--in">
                      {event.whatIsIncluded?.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div>
                      <h3 className="pi-includes__subtitle">Not included</h3>
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
                  <h2>Important information</h2>
                  <ul className="pi-notes">
                    {event.importantInformation.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="pi-trip-block">
                <h2>Gallery</h2>
                {event.media.gallery?.length ? (
                  <div className="pi-gallery">
                    {event.media.gallery.map((image) => (
                      <MediaBlock
                        key={image.src}
                        src={image.src}
                        alt={image.alt}
                        ratio="3-2"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="pi-gallery">
                    <MediaBlock ratio="3-2" />
                    <MediaBlock ratio="3-2" />
                    <MediaBlock ratio="3-2" />
                  </div>
                )}
              </section>

              {event.faq?.length ? (
                <section className="pi-trip-block">
                  <h2>Questions</h2>
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
                <h2>Cancellation</h2>
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
