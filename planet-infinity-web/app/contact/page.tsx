import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { Eyebrow } from "@/components/Eyebrow";
import { Placeholder } from "@/components/Placeholder";
import { Section } from "@/components/Section";
import { CTA } from "@/content/cta";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Planet Infinity about a trip, an event, or anything else.",
  alternates: { canonical: "/contact" },
};

/**
 * Contact.
 *
 * Unknown channels remain explicit placeholders. Confirmed business contact
 * details are rendered from content/placeholders.ts.
 */
export default async function ContactPage() {
  const copy = await getSiteCopy();
  return (
    <>
      <Section tone="ivory" className="pi-listing-hero">
        <Container size="read">
          <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
          <Eyebrow>Contact</Eyebrow>
          <h1 className="pi-listing-hero__title">{copy.contact_title}</h1>
          <p className="pi-listing-hero__lede">
            {copy.contact_lede}
          </p>
        </Container>
      </Section>

      <Section tone="white">
        <Container size="read">
          <dl className="pi-contact">
            <div>
              <dt>WhatsApp</dt>
              <dd>
                {copy.contact_whatsapp || <Placeholder id="whatsapp" label="Not published yet" />}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                {copy.contact_email || <Placeholder id="reservationsEmail" label="Not published yet" />}
              </dd>
            </div>
            <div>
              <dt>Office hours</dt>
              <dd>
                {copy.contact_office_hours || <Placeholder id="officeHours" label="Not published yet" />}
              </dd>
            </div>
            <div>
              <dt>Emergency contact</dt>
              <dd>
                {copy.contact_emergency || <Placeholder id="emergencyContact" label="Not published yet" />}
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
