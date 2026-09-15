import Image from "next/image";
import Link from "next/link";

type ThemeWorldCardProps = {
  href: string;
  title: string;
  description: string;
  context: string;
  hero?: string;
  logo?: string;
  channels: string[];
  index: number;
};

export function ThemeWorldCard({ href, title, description, context, hero, logo, channels, index }: ThemeWorldCardProps) {
  return (
    <Link href={href} className="pi-theme-world-card">
      <div className="pi-theme-world-card__visual">
        {hero ? <Image src={hero} alt="" fill sizes="(max-width: 899px) 100vw, 48vw" /> : <span className="pi-theme-world-card__fallback" aria-hidden="true">∞</span>}
        <span className="pi-theme-world-card__scrim" aria-hidden="true" />
        {logo ? <Image className="pi-theme-world-card__logo" src={logo} alt={`${title} theme identity`} width={220} height={220} /> : null}
        <span className="pi-theme-world-card__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="pi-theme-world-card__copy">
        <p className="pi-theme-world-card__status"><span aria-hidden="true" /> Available world</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="pi-theme-world-card__meta">
          <span>{context}</span>
          <span>{channels.join(" · ")}</span>
        </div>
        <strong>Enter this world <span aria-hidden="true">↗</span></strong>
      </div>
    </Link>
  );
}
