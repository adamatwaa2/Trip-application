"use client";

import { useRef, useState } from "react";

/** `controls=false` for a small glance card: it just autoplays muted, no
 * on-video buttons — the sound/pause overlay only earns its space on a
 * dedicated, larger hero (a trip's or event's own page). */
export function HeroVideo({ src, poster, label, controls = true }: { src: string; poster?: string; label: string; controls?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const toggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (ref.current) { ref.current.muted = nextMuted; void ref.current.play(); }
  };
  const togglePlayback = () => {
    if (!ref.current) return;
    if (ref.current.paused) { void ref.current.play(); setPaused(false); } else { ref.current.pause(); setPaused(true); }
  };
  return (
    <>
      <video ref={ref} className="pi-media__video" src={src} poster={poster} autoPlay loop muted={muted} playsInline preload="metadata" aria-label={label} />
      {controls ? (
        <div className="pi-media__video-controls">
          <button type="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Mute video"}>{muted ? "Sound on" : "Mute"}</button>
          <button type="button" onClick={togglePlayback} aria-label={paused ? "Play video" : "Pause video"}>{paused ? "Play" : "Pause"}</button>
        </div>
      ) : null}
    </>
  );
}
