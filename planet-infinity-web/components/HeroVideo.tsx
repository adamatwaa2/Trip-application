"use client";

import { useRef, useState } from "react";

export function HeroVideo({ src, poster, label }: { src: string; poster?: string; label: string }) {
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
  return <><video ref={ref} className="pi-media__video" src={src} poster={poster} autoPlay loop muted={muted} playsInline preload="metadata" aria-label={label} /><div className="pi-media__video-controls"><button type="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Mute video"}>{muted ? "Sound on" : "Mute"}</button><button type="button" onClick={togglePlayback} aria-label={paused ? "Play video" : "Pause video"}>{paused ? "Play" : "Pause"}</button></div></>;
}
