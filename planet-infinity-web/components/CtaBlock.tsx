import type { ReactNode } from "react";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

type CtaBlockProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  /** One primary decision. Everything else is a text link. */
  actions: ReactNode;
};

/**
 * The closing decision on a page. Light by default: CLAUDE.md caps dark
 * sections at one per page plus the footer, and the footer sits directly
 * below this — two Deep Ink sections must never be adjacent.
 */
export function CtaBlock({ eyebrow, title, body, actions }: CtaBlockProps) {
  return (
    <section className="pi-section pi-section--white pi-cta">
      <Container>
        <div className="pi-cta__inner">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2 className="pi-cta__title">{title}</h2>
          {body ? <p className="pi-cta__body">{body}</p> : null}
          <div className="pi-cta__actions">{actions}</div>
        </div>
      </Container>
    </section>
  );
}
