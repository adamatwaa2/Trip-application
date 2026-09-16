"use client";

import { useEffect, useRef, useState } from "react";

/** `controls=false` for a small glance card: it just autoplays muted, no
 * on-video buttons — the sound/pause overlay only earns its space on a
 * dedicated, larger hero (a trip's or event's own page). */
export function HeroVideo({ src, poster, label, controls = true }: { src: string; poster?: string; label: string; controls?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);
  const [failed, setFailed] = useState(false);

  const playVideo = () => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    const attempt = video.play();
    if (attempt) {
      void attempt.then(() => setPaused(false)).catch(() => setPaused(true));
    }
  };

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setPaused(true);
    setFailed(false);
    video.defaultMuted = true;
    video.muted = true;
    // Mobile Safari may not start autoplay until the media has enough data.
    // Retrying from canplay keeps the poster from becoming a permanent fallback.
    const retry = () => playVideo();
    video.addEventListener("canplay", retry);
    playVideo();
    return () => video.removeEventListener("canplay", retry);
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
        controls={controls}
        aria-label={label}
        onPlaying={() => { setPaused(false); setFailed(false); }}
        onPause={() => setPaused(true)}
        onError={() => { setFailed(true); setPaused(true); }}
      />
      {controls ? (
        <div className="pi-media__video-controls">
          <button type="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Mute video"}>{muted ? "Sound on" : "Mute"}</button>
          <button type="button" onClick={togglePlayback} aria-label={paused ? "Play video" : "Pause video"}>{paused ? "Play" : "Pause"}</button>
        </div>
      ) : null}
      {controls && paused && !failed ? <button className="pi-media__video-play" type="button" onClick={togglePlayback} aria-label="Play video">▶</button> : null}
      {controls && failed ? <div className="pi-media__video-error" role="status">Tap play to load this video</div> : null}
    </>
  );
}
