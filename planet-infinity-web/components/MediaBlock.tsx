import Image from "next/image";
import type { ReactNode } from "react";

type MediaBlockProps = {
  /** Real Planet Infinity photography only. No stock, no AI imagery. */
  src?: string;
  alt?: string;
  ratio?: "21-9" | "16-9" | "3-2" | "4-5" | "1-1";
  /** 0 when the image touches a screen edge, 24 for cards, 32 for hero cards. */
  radius?: "none" | "card" | "hero";
  /** Type sitting on the image needs a scrim before it lands. */
  children?: ReactNode;
  className?: string;
};

/**
 * An image slot. Until real photography exists the slot renders as a quiet
 * hairline field carrying its ratio — PI-WB-002: "an honest gradient beats a
 * borrowed photograph", and an honest empty frame beats a stock one.
 */
export function MediaBlock({
  src,
  alt = "",
  ratio = "3-2",
  radius = "card",
  children,
  className,
}: MediaBlockProps) {
  const classNames = [
    "pi-media",
    `pi-media--${ratio}`,
    `pi-media--radius-${radius}`,
    src ? null : "pi-media--empty",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      {src ? (
        <Image
          className="pi-media__img"
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 899px) 100vw, (max-width: 1199px) 50vw, 33vw"
        />
      ) : (
        <span className="pi-media__note" aria-hidden="true">
          Photography pending
        </span>
      )}
      {children ? <div className="pi-media__overlay">{children}</div> : null}
    </div>
  );
}
