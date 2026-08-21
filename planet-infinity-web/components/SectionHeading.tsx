import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

type SectionHeadingProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  /** One lede line, max 640px. Verbs over adjectives. */
  lede?: ReactNode;
  /** Sits opposite the heading on desktop — usually a secondary CTA. */
  action?: ReactNode;
  /** D2 for a major band, H1 for a page title, H2 for a block. */
  level?: "d2" | "h1" | "h2";
  align?: "start" | "center";
  as?: "h1" | "h2";
};

export function SectionHeading({
  eyebrow,
  title,
  lede,
  action,
  level = "d2",
  align = "start",
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div className={`pi-heading pi-heading--${align}`}>
      <div className="pi-heading__text">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Tag className={`pi-heading__title pi-heading__title--${level}`}>
          {title}
        </Tag>
        {lede ? <p className="pi-heading__lede">{lede}</p> : null}
      </div>
      {action ? <div className="pi-heading__action">{action}</div> : null}
    </div>
  );
}
