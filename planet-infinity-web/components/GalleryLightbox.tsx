"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HeroVideo } from "./HeroVideo";

type GalleryImage = { src: string; alt: string; type?: "image" | "video"; poster?: string };
type GalleryLayout = "swipe" | "grid";

export function GalleryLightbox({ images, layout = "swipe" }: { images: GalleryImage[]; layout?: GalleryLayout }) {
  const [active, setActive] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);

  const previous = () => setActive((value) => value === null ? null : (value - 1 + images.length) % images.length);
  const next = () => setActive((value) => value === null ? null : (value + 1) % images.length);

  useEffect(() => {
    if (active === null) return;
    const previous = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") setActive((value) => value === null ? null : (value + 1) % images.length);
      if (event.key === "ArrowLeft") setActive((value) => value === null ? null : (value - 1 + images.length) % images.length);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, images.length]);

  if (!images.length) return null;

  return (
    <>
      <div className="pi-gallery-shell">
        {images.length > 1 ? (
          <div className="pi-gallery__summary" aria-label={`${images.length} gallery items`}>
            <strong>{images.length}</strong>
            <span>{layout === "grid" ? "photos & videos · scroll to explore" : "photos & videos · swipe to explore"}</span>
          </div>
        ) : null}
        <div className={`pi-gallery pi-gallery--interactive pi-gallery--layout-${layout}`}>
        {images.map((image, index) => (
          <button key={`${image.src}-${index}`} type="button" className="pi-gallery__item" onClick={() => setActive(index)} aria-label={`Open photo ${index + 1} of ${images.length}`}>
            {image.type === "video" ? (
              <video src={image.src} poster={image.poster} autoPlay loop muted playsInline preload="auto" />
            ) : layout === "grid" ? (
              // A natural-size image is intentional here: masonry must honour
              // each upload's portrait or landscape proportions.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.src} alt={image.alt} loading="eager" decoding="async" />
            ) : (
              <Image src={image.src} alt={image.alt} fill sizes="(max-width: 899px) 68vw, 33vw" />
            )}
            <span className="pi-gallery__number">{String(index + 1).padStart(2, "0")}</span>
            {index === 0 && images.length > 1 ? <span className="pi-gallery__total">View all {images.length}</span> : null}
          </button>
        ))}
        </div>
      </div>
      {active !== null && typeof document !== "undefined" ? createPortal((
        <div
          className="pi-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Trip photo gallery"
          onClick={() => setActive(null)}
          onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return;
            const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
            touchStart.current = null;
            if (Math.abs(distance) < 42) return;
            if (distance > 0) previous();
            else next();
          }}
        >
          <button type="button" className="pi-lightbox__close" onClick={() => setActive(null)} aria-label="Close gallery">×</button>
          {images.length > 1 ? <button type="button" className="pi-lightbox__nav pi-lightbox__nav--prev" onClick={(event) => { event.stopPropagation(); previous(); }} aria-label="Previous photo">←</button> : null}
          <div className="pi-lightbox__image" onClick={(event) => event.stopPropagation()}>
            {images[active].type === "video" ? <HeroVideo src={images[active].src} poster={images[active].poster} label={images[active].alt || "Gallery video"} /> : <Image src={images[active].src} alt={images[active].alt} fill sizes="100vw" priority />}
          </div>
          {images.length > 1 ? <button type="button" className="pi-lightbox__nav pi-lightbox__nav--next" onClick={(event) => { event.stopPropagation(); next(); }} aria-label="Next photo">→</button> : null}
          {images.length > 1 ? (
            <div className="pi-lightbox__strip" onClick={(event) => event.stopPropagation()}>
              {images.map((image, index) => (
                <button
                  key={`${image.src}-thumb-${index}`}
                  type="button"
                  className={index === active ? "pi-lightbox__thumb pi-lightbox__thumb--active" : "pi-lightbox__thumb"}
                  onClick={() => setActive(index)}
                  aria-label={`Show item ${index + 1}`}
                >
                  {image.type === "video" ? <video src={image.src} poster={image.poster} muted playsInline preload="metadata" /> : <Image src={image.src} alt="" fill sizes="72px" />}
                </button>
              ))}
            </div>
          ) : null}
          <p className="pi-lightbox__count">{active + 1} / {images.length}</p>
        </div>
      ), document.body) : null}
    </>
  );
}
