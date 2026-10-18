import Link from "next/link";
import Image from "next/image";
import { Container } from "./Container";
import { SiteFooterFrame } from "./SiteFooterFrame";
import { SiteFooterBrand } from "./SiteFooterBrand";
import { getSiteCopy } from "@/lib/site-copy";
import { getSitePresentation } from "@/lib/site-presentation";
import type { FooterItem } from "@/content/site-presentation";

function FooterLink({ item }: { item: FooterItem }) {
  if (!item.visible) return null;
  if (item.soon) {
    return (
      <li>
        <span className="pi-footer__link pi-footer__link--soon" aria-disabled="true">
          {item.label}
          <span className="pi-nav__chip">Soon</span>
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

function Column({ title, items }: { title: string; items: FooterItem[] }) {
  return (
    <div>
      <h2 className="pi-footer__heading">{title}</h2>
      <ul className="pi-footer__list">
        {items.map((item, index) => (
          <FooterLink key={index} item={item} />
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
  const [copy, presentation] = await Promise.all([getSiteCopy(), getSitePresentation()]);
  const footerTagline = copy.footer_tagline.replace(/\\n/g, "\n");
  return (
    <SiteFooterFrame>
      <Container>
        <div className="pi-footer__top">
          <div className="pi-footer__brand">
            <SiteFooterBrand logo={presentation.footerLogo} />
            <p className="pi-footer__line">{footerTagline}</p>
          </div>

          <div className="pi-footer__cols">
            {presentation.columns.map((column, index) => <Column key={index} title={column.title} items={column.items} />)}

            <div>
              <h2 className="pi-footer__heading">{presentation.footerContactTitle}</h2>
              <ul className="pi-footer__list">
                <li className="pi-footer__contact">
                  WhatsApp {copy.contact_whatsapp}
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

        {presentation.showApp ? <section className="pi-footer__app-strip" id="get-the-app" aria-labelledby="pi-footer-app-title">
          <div>
            <span className="pi-footer__app-status">Coming soon</span>
            <h2 id="pi-footer-app-title">{presentation.appTitle}</h2>
            <p>{presentation.appDescription}</p>
          </div>
          <div className="pi-footer__app-phone">
            <Image src="/app-preview/google-play-current.webp" alt="Current Planet Infinity app interface from Google Play, showing experiences, stays, trips, events and community" width={273} height={592} sizes="156px" />
          </div>
        </section> : null}

        <div className="pi-footer__bottom">
          <span>{presentation.footerBrand}</span>
          <span>
            <a href={presentation.instagram} rel="me" style={{ textTransform: "none" }}>
              planetinfinity.ent
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
