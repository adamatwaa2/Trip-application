import type { ReactNode } from "react";

type ComingSoonCardProps = {
  eyebrow: string;
  title: string;
  body: ReactNode;
};

/**
 * A part of the Planet Infinity universe that is not open yet.
 *
 * Deliberately intentional rather than apologetic — and deliberately empty of
 * product: no fake items, no fake prices, no catalogue behind it.
 */
export function ComingSoonCard({ eyebrow, title, body }: ComingSoonCardProps) {
  return (
    <article className="pi-soon">
      <p className="pi-soon__eyebrow">
        {eyebrow}
        <span className="pi-nav__chip">Soon</span>
      </p>
      <h3 className="pi-soon__title">{title}</h3>
      <p className="pi-soon__body">{body}</p>
    </article>
  );
}
