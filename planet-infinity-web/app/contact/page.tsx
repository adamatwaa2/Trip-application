import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { Placeholder } from "@/components/Placeholder";
import { Section } from "@/components/Section";
import { CTA } from "@/content/cta";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Planet Infinity about a trip, an event, or anything else.",
};

/**
 * Contact.
 *
 * Unknown channels remain explicit placeholders. Confirmed business contact
 * details are rendered from content/placeholders.ts.
 */
export default function ContactPage() {
  return (
    <>
      <Section tone="ivory" className="pi-listing-hero">
        <Container size="read">
          <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
          <Eyebrow>Contact</Eyebrow>
          <h1 className="pi-listing-hero__title">Talk to us</h1>
          <p className="pi-listing-hero__lede">
            The person who answers is the person who will be there on the day.
          </p>
        </Container>
      </Section>

      <Section tone="white">
        <Container size="read">
          <dl className="pi-contact">
            <div>
              <dt>WhatsApp</dt>
              <dd>
                <Placeholder id="whatsapp" label="Not published yet" />
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <Placeholder id="reservationsEmail" label="Not published yet" />
              </dd>
            </div>
            <div>
              <dt>Office hours</dt>
              <dd>
                <Placeholder id="officeHours" label="Not published yet" />
              </dd>
            </div>
            <div>
              <dt>Emergency contact</dt>
              <dd>
                <Placeholder id="emergencyContact" label="Not published yet" />
              </dd>
            </div>
            <div>
              <dt>Instagram</dt>
              <dd>
                <Placeholder id="instagramHandle" />
              </dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>Planet Infinity Entertainment</dd>
            </div>
          </dl>

          <p className="pi-contact__note">
            Booking a specific trip or event? Starting from its page tells us
            what you are asking about, which gets you a faster answer.
          </p>

          <div className="pi-contact__actions">
            <ButtonLink href="/trips">{CTA.exploreTravel}</ButtonLink>
            <ButtonLink href="/events" variant="secondary">
              {CTA.exploreEvents}
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
