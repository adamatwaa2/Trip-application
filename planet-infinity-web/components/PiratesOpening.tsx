"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PiratesExperience.module.css";

/** Real stock footage. Motion stays optional and pauses outside the viewport. */
export function PiratesOpening() {
  const video = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !reducedMotion.matches && !userPaused.current) {
        void element.play().catch(() => {});
      } else element.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .15 });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
      element.pause();
    };
  }, []);

  function toggle() {
    const element = video.current;
    if (!element) return;
    if (element.paused) { userPaused.current = false; void element.play().catch(() => setFailed(true)); }
    else { userPaused.current = true; element.pause(); }
  }

  return <figure className={styles.film}>
    <div className={styles.filmTop}><span>Captain’s log / 001</span><span aria-hidden="true">✧</span></div>
    <div className={styles.filmWindow}>
      <video ref={video} src="/media/pirates/sailing-opening.mp4" poster="/media/pirates/sailing-poster.jpg" muted loop playsInline preload="metadata" aria-label="A real wooden ship moving across the sea at dusk" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} />
      <button type="button" className={styles.filmToggle} onClick={toggle} aria-label={playing ? "Pause sailing film" : "Play sailing film"} aria-pressed={playing} disabled={failed}><span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span>{playing ? "Pause" : "Play"}</button>
      <span className={styles.filmCoordinates} aria-hidden="true">The horizon is just the beginning.</span>
    </div>
    <figcaption><span>Atmosphere film · Not the trip’s boat</span><a href="https://www.pexels.com/video/a-pirate-ship-is-sailing-in-the-ocean-28409851/" target="_blank" rel="noreferrer">Tatiana Tzviatkova / Pexels ↗</a></figcaption>
    {failed ? <p className={styles.note} role="status">The sailing film is unavailable. You can still explore the adventure below.</p> : null}
  </figure>;
}
