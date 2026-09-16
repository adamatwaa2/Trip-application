"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** `controls=false` for a small glance card: it just autoplays muted, no
 * on-video buttons — the sound/pause overlay only earns its space on a
 * dedicated, larger hero (a trip's or event's own page). */
export function HeroVideo({ src, poster, label, controls = true, preload = "auto" }: { src: string; poster?: string; label: string; controls?: boolean; preload?: "auto" | "metadata" }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);

  const playVideo = useCallback(() => {
    const video = ref.current;
    if (!video) return;
    const attempt = video.play();
    if (attempt) {
      void attempt.then(() => setPaused(false)).catch(() => setPaused(true));
    }
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setPaused(true);
    setMuted(true);
    // Set both properties before the first attempt. This matters on iOS Safari,
    // which only permits unattended playback when the element is already muted.
    video.defaultMuted = true;
    video.muted = true;
    // Mobile Safari can reject the first attempt while the element hydrates or
    // before enough bytes arrive. Retry while loading, and again after the
    // visitor's first gesture (which also satisfies strict power/data modes).
    const retry = () => {
      if (!document.hidden) playVideo();
    };
    const retryWhenVisible = () => retry();
    const retryTimers = [0, 160, 500, 1200].map((delay) => window.setTimeout(retry, delay));
    video.addEventListener("loadeddata", retry);
    video.addEventListener("canplay", retry);
    document.addEventListener("visibilitychange", retryWhenVisible);
    document.addEventListener("pointerdown", retry, { passive: true });
    document.addEventListener("touchstart", retry, { passive: true });
    return () => {
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      video.removeEventListener("loadeddata", retry);
      video.removeEventListener("canplay", retry);
      document.removeEventListener("visibilitychange", retryWhenVisible);
      document.removeEventListener("pointerdown", retry);
      document.removeEventListener("touchstart", retry);
    };
  }, [playVideo, src]);

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
        preload={preload}
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
