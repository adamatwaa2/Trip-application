"use client";

import { useEffect, useRef, useState } from "react";

/** `controls=false` for a small glance card: it just autoplays muted, no
 * on-video buttons — the sound/pause overlay only earns its space on a
 * dedicated, larger hero (a trip's or event's own page). */
export function HeroVideo({ src, poster, label, controls = true }: { src: string; poster?: string; label: string; controls?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);

  const playVideo = () => {
    const video = ref.current;
    if (!video) return;
    const attempt = video.play();
    if (attempt) {
      void attempt.then(() => setPaused(false)).catch(() => setPaused(true));
    }
  };

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setPaused(true);
    video.defaultMuted = true;
    video.muted = true;
    // Mobile Safari may not start autoplay until the media has enough data.
    // Retrying from canplay keeps the poster from becoming a permanent fallback.
    const retry = () => {
      if (!document.hidden) playVideo();
    };
    const retryWhenVisible = () => retry();
    video.addEventListener("loadeddata", retry);
    video.addEventListener("canplay", retry);
    document.addEventListener("visibilitychange", retryWhenVisible);
    playVideo();
    return () => {
      video.removeEventListener("loadeddata", retry);
      video.removeEventListener("canplay", retry);
      document.removeEventListener("visibilitychange", retryWhenVisible);
    };
  }, [src]);

  const toggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (ref.current) {
      ref.current.muted = nextMuted;
      const attempt = ref.current.play();
      if (attempt) void attempt.then(() => setPaused(false)).catch(() => setPaused(true));
    }
  };
  const togglePlayback = () => {
    if (!ref.current) return;
    if (ref.current.paused) playVideo();
    else { ref.current.pause(); setPaused(true); }
  };
  return (
    <>
      <video
        ref={ref}
        className="pi-media__video"
        src={src}
        poster={poster}
        autoPlay
        loop
        muted={muted}
        playsInline
        preload="auto"
        controls={false}
        aria-label={label}
        onPlaying={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onError={() => setPaused(true)}
      />
      {controls ? (
        <div className="pi-media__video-controls">
          <button type="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Mute video"}>{muted ? "Sound on" : "Mute"}</button>
          <button type="button" onClick={togglePlayback} aria-label={paused ? "Resume video" : "Pause video"}>{paused ? "Resume" : "Pause"}</button>
        </div>
      ) : null}
    </>
  );
}
