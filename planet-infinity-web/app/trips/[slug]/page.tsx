import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { DemoBadge } from "@/components/DemoBadge";
import { Eyebrow } from "@/components/Eyebrow";
import { MediaBlock } from "@/components/MediaBlock";
import { Section } from "@/components/Section";
import { TripBookingModule } from "@/components/TripBookingModule";
import { AvailabilityPill } from "@/components/AvailabilityPill";
import { Placeholder } from "@/components/Placeholder";
import { allTrips, findTrip } from "@/content/trips";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allTrips().map((trip) => ({ slug: trip.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const trip = findTrip(slug);
  if (!trip) return { title: "Trip not found" };
  return { title: trip.title, description: trip.shortDescription };
}

/**
 * Trip detail page.
 *
 * The booking module is the ONLY place that decides how this trip is booked.
 * There is no seat map on this page: seats live inside the flow, and only for
 * trips that enable them.
 */
export default async function TripPage({ params }: Params) {
  const { slug } = await params;
  const trip = findTrip(slug);
  if (!trip) notFound();

  return (
    <>
      <Section tone="ivory" className="pi-trip-hero">
        <Container>
          <Breadcrumbs
            trail={[
              { label: "Home", href: "/" },
              { label: "Travel", href: "/trips" },
              { label: trip.title },
            ]}
          />
          <Eyebrow>{trip.destination}</Eyebrow>
          <h1 className="pi-trip-hero__title">{trip.title}</h1>
          <p className="pi-trip-hero__lede">{trip.shortDescription}</p>

          <div className="pi-trip-facts">
            <div>
              <dt>Destination</dt>
              <dd>{trip.destination}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{trip.duration ?? <Placeholder id="tripDuration" />}</dd>
            </div>
            <div>
              <dt>Meeting point</dt>
              <dd>{trip.meetingPoint ?? <Placeholder id="meetingPoint" />}</dd>
            </div>
            <div>
              <dt>Departure</dt>
              <dd>{trip.departureTime ?? <Placeholder id="departureTime" />}</dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>
                {trip.availability ? (
                  <AvailabilityPill state={trip.availability} />
                ) : (
                  <Placeholder id="availability" />
                )}
              </dd>
            </div>
          </div>

          {trip.isDemo ? (
            <p className="pi-trip-hero__demo">
              <DemoBadge /> This is an architecture test case, not a real
              Planet Infinity trip. Its prices and details are not real.
            </p>
          ) : null}

          <div className="pi-trip-hero__media">
            <MediaBlock
              src={trip.media.hero}
              alt={trip.media.heroAlt ?? ""}
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
                <h2>Overview</h2>
                {trip.description.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </section>

              {trip.included?.length || trip.notIncluded?.length ? (
                <section className="pi-trip-block">
                  <h2>What is included</h2>
                  <div className="pi-includes">
                    <ul className="pi-includes__list pi-includes__list--in">
                      {trip.included?.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div>
                      <h3 className="pi-includes__subtitle">Not included</h3>
                      <ul className="pi-includes__list pi-includes__list--out">
                        {trip.notIncluded?.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              ) : null}

              {trip.itinerary?.length ? (
                <section className="pi-trip-block">
                  <h2>Itinerary</h2>
                  <ol className="pi-itinerary">
                    {trip.itinerary.map((stop) => (
                      <li key={stop.label}>
                        <p className="pi-itinerary__label">{stop.label}</p>
                        <h3 className="pi-itinerary__title">{stop.title}</h3>
                        <p className="pi-itinerary__body">{stop.body}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {trip.importantInformation?.length ? (
                <section className="pi-trip-block">
                  <h2>Important information</h2>
                  <ul className="pi-notes">
                    {trip.importantInformation.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="pi-trip-block">
                <h2>Gallery</h2>
                {trip.media.gallery?.length ? (
                  <div className="pi-gallery">
                    {trip.media.gallery.map((image) => (
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

              {trip.faq?.length ? (
                <section className="pi-trip-block">
                  <h2>Questions</h2>
                  <div className="pi-faq">
                    {trip.faq.map((item) => (
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
                  {trip.cancellationSummary ??
                    "Cancellation terms are set per trip and shared in writing before any payment is made."}
                </p>
              </section>
            </div>

            <div className="pi-trip-aside">
              <TripBookingModule trip={trip} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
