import Link from "next/link";
import Image from "next/image";
import { Container } from "./Container";
import { Placeholder } from "./Placeholder";
import { SiteFooterFrame } from "./SiteFooterFrame";
import { SiteFooterBrand } from "./SiteFooterBrand";
import { getSiteCopy } from "@/lib/site-copy";
import {
  COMING_SOON_LINKS,
  COMPANY_LINKS,
  PLAN_LINKS,
  POLICY_LINKS,
  WORLD_NAV,
  type NavItem,
} from "@/content/nav";

function FooterLink({ item }: { item: NavItem }) {
  if (item.status === "soon") {
    return (
      <li>
        <span className="pi-footer__link pi-footer__link--soon" aria-disabled="true">
          {item.label}
          <span className="pi-nav__chip">{item.note ?? "Soon"}</span>
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link href={item.href} className="pi-footer__link">
        {item.label}
      </Link>
    </li>
  );
}

function Column({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      <h2 className="pi-footer__heading">{title}</h2>
      <ul className="pi-footer__list">
        {items.map((item) => (
          <FooterLink key={item.href} item={item} />
        ))}
      </ul>
    </div>
  );
}

/**
 * The footer is the site's standing Deep Ink section — a page may carry one
 * further dark section, never adjacent to this one.
 *
 * Contact details are placeholders. Nothing here is invented; the address
 * line is the registered company location from PI-WB-002.
 */
export async function SiteFooter() {
  const copy = await getSiteCopy();
  const footerTagline = copy.footer_tagline.replace(/\\n/g, "\n");
  return (
    <SiteFooterFrame>
      <Container>
        <div className="pi-footer__top">
          <div className="pi-footer__brand">
            <SiteFooterBrand />
            <p className="pi-footer__line">{footerTagline}</p>
          </div>

          <div className="pi-footer__cols">
            <Column title="Worlds" items={WORLD_NAV} />
            <Column title="Plan" items={PLAN_LINKS} />
            <Column title="Company" items={COMPANY_LINKS} />
            <Column title="Coming soon" items={COMING_SOON_LINKS} />
            <Column title="Policies" items={POLICY_LINKS} />

            <div>
              <h2 className="pi-footer__heading">Talk to us</h2>
              <ul className="pi-footer__list">
                <li className="pi-footer__contact">
                  WhatsApp <Placeholder id="whatsapp" />
                </li>
                <li className="pi-footer__contact">
                  Email {copy.contact_email}
                </li>
                <li className="pi-footer__contact">
                  {copy.contact_address}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <section className="pi-footer__app-strip" id="get-the-app" aria-labelledby="pi-footer-app-title">
          <div>
            <span className="pi-footer__app-status">Coming soon</span>
            <h2 id="pi-footer-app-title">The Planet Infinity app.</h2>
            <p>Bringing community, experiences and everyday services together.</p>
            <p className="pi-footer__app-note">In development for iPhone and Android.</p>
          </div>
          <div className="pi-footer__app-phone">
            <Image src="/app-preview/google-play-current.webp" alt="Current Planet Infinity app interface from Google Play, showing experiences, stays, trips, events and community" width={273} height={592} sizes="156px" />
          </div>
        </section>

        <div className="pi-footer__bottom">
          <span>Planet Infinity Entertainment</span>
          <span>
            <a href="https://www.instagram.com/planetinfinity.ent/" rel="me">
              <Placeholder id="instagramHandle" />
            </a>
          </span>
          <Link href="/admin" className="pi-footer__team-access">
            Team access
          </Link>
          <span>© {new Date().getFullYear()} planetinfinity.online</span>
        </div>
      </Container>
    </SiteFooterFrame>
  );
}
