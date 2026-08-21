import Link from "next/link";
import { BrandLockup } from "./BrandLockup";
import { Container } from "./Container";
import { Placeholder } from "./Placeholder";
import { PLAN_LINKS, POLICY_LINKS, WORLDS, type NavItem } from "@/content/nav";

function FooterLink({ item }: { item: NavItem }) {
  if (!item.ready) {
    return (
      <li>
        <span
          className="pi-footer__link pi-footer__link--pending"
          aria-disabled="true"
          title="This page is not built yet"
        >
          {item.label}
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

/**
 * The footer is the site's standing Deep Ink section. Under CLAUDE.md a page
 * may carry one further dark section beyond this one, never adjacent to it.
 *
 * Every contact detail is a placeholder — none of it is invented.
 */
export function SiteFooter() {
  return (
    <footer className="pi-night pi-footer">
      <Container>
        <div className="pi-footer__top">
          <div className="pi-footer__brand">
            <BrandLockup tone="ivory" />
            <p className="pi-footer__line">
              Planet Infinity Entertainment
              <br />
              Dahab · South Sinai · Egypt
            </p>
          </div>

          <div className="pi-footer__cols">
            <div>
              <h2 className="pi-footer__heading">Explore</h2>
              <ul className="pi-footer__list">
                {WORLDS.map((item) => (
                  <FooterLink key={item.href} item={item} />
                ))}
              </ul>
            </div>

            <div>
              <h2 className="pi-footer__heading">Plan</h2>
              <ul className="pi-footer__list">
                {PLAN_LINKS.map((item) => (
                  <FooterLink key={item.href} item={item} />
                ))}
              </ul>
            </div>

            <div>
              <h2 className="pi-footer__heading">Policies</h2>
              <ul className="pi-footer__list">
                {POLICY_LINKS.map((item) => (
                  <FooterLink key={item.href} item={item} />
                ))}
              </ul>
            </div>

            <div>
              <h2 className="pi-footer__heading">Talk to us</h2>
              <ul className="pi-footer__list">
                <li className="pi-footer__contact">
                  WhatsApp <Placeholder id="whatsapp" />
                </li>
                <li className="pi-footer__contact">
                  Email <Placeholder id="reservationsEmail" />
                </li>
                <li className="pi-footer__contact">
                  Hours <Placeholder id="officeHours" />
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pi-footer__bottom">
          <span>planetinfinity.online</span>
          <span>
            <Placeholder id="instagramHandle" />
          </span>
          <span>
            © {new Date().getFullYear()} Planet Infinity Entertainment
          </span>
        </div>
      </Container>
    </footer>
  );
}
