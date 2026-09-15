"use client";

import { useLayoutEffect } from "react";
import type { CatalogVisualTheme } from "@/lib/catalog-visual-theme";

type ExtractedLogo = { source: string; primary: string; secondary: string };

function colourToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`;
}

async function extractLogoIdentity(source: string): Promise<ExtractedLogo> {
  const response = await fetch(source);
  if (!response.ok) throw new Error("Logo image could not be loaded.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Logo image could not be decoded."));
      nextImage.src = objectUrl;
    });
    const size = 320;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Logo image could not be prepared.");
    const fit = Math.min(size / image.naturalWidth, size / image.naturalHeight);
    const width = image.naturalWidth * fit;
    const height = image.naturalHeight * fit;
    context.clearRect(0, 0, size, size);
    context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
    const imageData = context.getImageData(0, 0, size, size);
    const pixels = imageData.data;
    let transparent = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] < 245) transparent += 1;
    }
    if (transparent / (size * size) < .025) {
      const corners = [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]] as const;
      const background = corners.reduce((sum, [x, y]) => {
        const index = (y * size + x) * 4;
        return [sum[0] + pixels[index], sum[1] + pixels[index + 1], sum[2] + pixels[index + 2]];
      }, [0, 0, 0]).map((value) => value / corners.length);
      const lightness = (background[0] + background[1] + background[2]) / 3;
      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const distance = Math.hypot(red - background[0], green - background[1], blue - background[2]);
        const edge = lightness < 34 ? Math.max(red, green, blue) : lightness > 224 ? 255 - Math.min(red, green, blue) : distance;
        pixels[index + 3] = Math.round(Math.max(0, Math.min(1, (edge - 15) / 52)) * 255);
      }
      context.putImageData(imageData, 0, 0);
    }

    const colours = new Map<string, { score: number; red: number; green: number; blue: number }>();
    const prepared = context.getImageData(0, 0, size, size).data;
    for (let index = 0; index < prepared.length; index += 4) {
      if (prepared[index + 3] < 45) continue;
      const red = prepared[index];
      const green = prepared[index + 1];
      const blue = prepared[index + 2];
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const saturation = max ? (max - min) / max : 0;
      const brightness = (max + min) / 510;
      if (brightness > .97 || brightness < .035) continue;
      const key = `${Math.round(red / 30)}-${Math.round(green / 30)}-${Math.round(blue / 30)}`;
      const weight = 1 + saturation * 2.2;
      const bucket = colours.get(key) ?? { score: 0, red: 0, green: 0, blue: 0 };
      bucket.score += weight;
      bucket.red += red * weight;
      bucket.green += green * weight;
      bucket.blue += blue * weight;
      colours.set(key, bucket);
    }
    const ranked = [...colours.values()]
      .map((bucket) => ({ red: bucket.red / bucket.score, green: bucket.green / bucket.score, blue: bucket.blue / bucket.score, score: bucket.score }))
      .sort((a, b) => b.score - a.score);
    const primary = ranked[0] ?? { red: 245, green: 155, blue: 35, score: 1 };
    const secondary = ranked.find((colour) => Math.hypot(colour.red - primary.red, colour.green - primary.green, colour.blue - primary.blue) > 82)
      ?? { red: Math.min(255, primary.red + 28), green: Math.min(255, primary.green + 38), blue: Math.min(255, primary.blue + 54), score: 1 };
    return {
      source: canvas.toDataURL("image/png"),
      primary: colourToHex(primary.red, primary.green, primary.blue),
      secondary: colourToHex(secondary.red, secondary.green, secondary.blue),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function CatalogThemeRuntime({ theme }: { theme: CatalogVisualTheme }) {
  const logo = theme.logo ?? "";

  useLayoutEffect(() => {
    const root = document.documentElement;
    const slots = Array.from(document.querySelectorAll("[data-brand-logo-slot]"));
    const frame = document.querySelector<HTMLElement>(".pi-catalog-theme");
    let cancelled = false;
    root.dataset.catalogTheme = "true";
    root.dataset.catalogSurface = theme.surface ?? "light";
    root.dataset.catalogTypography = theme.typography ?? "brand";
    root.style.setProperty("--pi-active-catalog-primary", theme.primaryColor ?? "#f59b23");
    root.style.setProperty("--pi-active-catalog-secondary", theme.secondaryColor ?? "#7bcfd8");

    if (slots.length && logo) {
      void extractLogoIdentity(logo).then((identity) => {
        if (cancelled) return;
        root.style.setProperty("--pi-active-catalog-primary", identity.primary);
        root.style.setProperty("--pi-active-catalog-secondary", identity.secondary);
        frame?.style.setProperty("--pi-catalog-primary", identity.primary);
        frame?.style.setProperty("--pi-catalog-secondary", identity.secondary);
        for (const slot of slots) {
          slot.setAttribute("data-custom-logo", "true");
          const customLogo = document.createElement("img");
          customLogo.className = "pi-brand__custom-logo";
          customLogo.src = identity.source;
          customLogo.alt = theme.logoAlt || "Experience logo";
          slot.append(customLogo);
        }
      }).catch(() => {
        // Keep the default Planet Infinity mark if a remote image cannot be decoded.
      });
    }

    return () => {
      cancelled = true;
      delete root.dataset.catalogTheme;
      delete root.dataset.catalogSurface;
      delete root.dataset.catalogTypography;
      root.style.removeProperty("--pi-active-catalog-primary");
      root.style.removeProperty("--pi-active-catalog-secondary");
      for (const slot of slots) {
        slot.removeAttribute("data-custom-logo");
        slot.querySelector(".pi-brand__custom-logo")?.remove();
      }
    };
  }, [logo, theme.logoAlt, theme.primaryColor, theme.secondaryColor, theme.surface, theme.typography]);

  return null;
}
