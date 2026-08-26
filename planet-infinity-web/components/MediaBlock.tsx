import Image from "next/image";
import type { ReactNode } from "react";

type MediaBlockProps = {
  /** Real Planet Infinity photography only. No stock, no AI imagery. */
  src?: string;
  /** First-party uploaded video. `src` becomes its poster when both exist. */
  videoSrc?: string;
  alt?: string;
  ratio?: "21-9" | "16-9" | "3-2" | "4-5" | "1-1";
  /** 0 when the image touches a screen edge, 24 for cards, 32 for hero cards. */
  radius?: "none" | "card" | "hero";
  /** Type sitting on the image needs a scrim before it lands. */
  children?: ReactNode;
  className?: string;
  /** Branded copy used when first-party photography has not been uploaded. */
  emptyLabel?: string;
};

/**
 * An image slot. Until real photography exists the slot renders as a quiet
 * hairline field carrying its ratio — PI-WB-002: "an honest gradient beats a
 * borrowed photograph", and an honest empty frame beats a stock one.
 */
export function MediaBlock({
  src,
  videoSrc,
  alt = "",
  ratio = "3-2",
  radius = "card",
  children,
  className,
  emptyLabel = "Planet Infinity",
}: MediaBlockProps) {
  const classNames = [
    "pi-media",
    `pi-media--${ratio}`,
    `pi-media--radius-${radius}`,
    src || videoSrc ? null : "pi-media--empty",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      {videoSrc ? (
        <video
          className="pi-media__video"
          src={videoSrc}
          poster={src}
          controls
          muted
          playsInline
          preload="metadata"
          aria-label={alt || "Planet Infinity video"}
        />
      ) : src ? (
        <Image
          className="pi-media__img"
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 899px) 100vw, (max-width: 1199px) 50vw, 33vw"
        />
      ) : (
        <div className="pi-media__fallback" aria-hidden="true">
          <span className="pi-media__fallback-mark">∞</span>
          <span className="pi-media__fallback-label">{emptyLabel}</span>
        </div>
      )}
      {children ? <div className="pi-media__overlay">{children}</div> : null}
    </div>
  );
}
