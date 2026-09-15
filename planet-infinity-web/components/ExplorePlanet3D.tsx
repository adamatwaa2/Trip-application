"use client";

import { useRef, type PointerEvent } from "react";
import type { CatalogVisualTheme } from "@/lib/catalog-visual-theme";

const ORIGINAL_GOLD_MARK = "/brand/planet-infinity-orange.png";

export function ExplorePlanet3D({ theme }: { theme?: CatalogVisualTheme }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const image = theme?.logo && /\.png(?:$|[?#])/i.test(theme.logo) ? theme.logo : ORIGINAL_GOLD_MARK;

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if ((theme?.explorerMotion ?? "interactive") !== "interactive") return;
    const stage = stageRef.current;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    stage.style.setProperty("--pi-logo-tilt-x", `${(-y * 3.2).toFixed(2)}deg`);
    stage.style.setProperty("--pi-logo-tilt-y", `${(x * 4.2).toFixed(2)}deg`);
    stage.style.setProperty("--pi-logo-light-x", `${(50 + x * 18).toFixed(1)}%`);
    stage.style.setProperty("--pi-logo-light-y", `${(42 + y * 14).toFixed(1)}%`);
  };

  const reset = () => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--pi-logo-tilt-x", "0deg");
    stage.style.setProperty("--pi-logo-tilt-y", "0deg");
    stage.style.setProperty("--pi-logo-light-x", "50%");
    stage.style.setProperty("--pi-logo-light-y", "42%");
  };

  return (
    <div
      ref={stageRef}
      className="pi-planet-render"
      data-finish={theme?.finish ?? "soft-metal"}
      data-depth={theme?.depth ?? "raised"}
      data-motion={theme?.explorerMotion ?? "interactive"}
      onPointerMove={move}
      onPointerLeave={reset}
    >
      <div className="pi-planet-render__depth" aria-hidden="true" />
      {/* Admin-managed logos can come from the configured public media storage. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pi-planet-render__image" src={image} alt={theme?.logoAlt || "Planet Infinity 3D emblem"} />
      <div className="pi-planet-render__light" aria-hidden="true" />
    </div>
  );
}
