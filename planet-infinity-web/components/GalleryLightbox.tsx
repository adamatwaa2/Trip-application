"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type GalleryImage = { src: string; alt: string; type?: "image" | "video"; poster?: string };

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<number | null>(null);

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
      <div className="pi-gallery pi-gallery--interactive">
        {images.map((image, index) => (
          <button key={`${image.src}-${index}`} type="button" className="pi-gallery__item" onClick={() => setActive(index)} aria-label={`Open photo ${index + 1} of ${images.length}`}>
            {image.type === "video" ? <video src={image.src} poster={image.poster} autoPlay loop muted playsInline preload="auto" /> : <Image src={image.src} alt={image.alt} fill sizes="(max-width: 899px) 50vw, 33vw" />}
            <span className="pi-gallery__number">{String(index + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </div>
      {active !== null ? (
        <div className="pi-lightbox" role="dialog" aria-modal="true" aria-label="Trip photo gallery" onClick={() => setActive(null)}>
          <button type="button" className="pi-lightbox__close" onClick={() => setActive(null)} aria-label="Close gallery">×</button>
          {images.length > 1 ? <button type="button" className="pi-lightbox__nav pi-lightbox__nav--prev" onClick={(event) => { event.stopPropagation(); setActive((active - 1 + images.length) % images.length); }} aria-label="Previous photo">←</button> : null}
          <div className="pi-lightbox__image" onClick={(event) => event.stopPropagation()}>
            {images[active].type === "video" ? <video src={images[active].src} poster={images[active].poster} controls autoPlay playsInline /> : <Image src={images[active].src} alt={images[active].alt} fill sizes="100vw" priority />}
          </div>
          {images.length > 1 ? <button type="button" className="pi-lightbox__nav pi-lightbox__nav--next" onClick={(event) => { event.stopPropagation(); setActive((active + 1) % images.length); }} aria-label="Next photo">→</button> : null}
          <p className="pi-lightbox__count">{active + 1} / {images.length}</p>
        </div>
      ) : null}
    </>
  );
}
