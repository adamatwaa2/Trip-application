"use client";
import { useLayoutEffect } from "react";
export function SocotraTheme() {
  useLayoutEffect(() => {
    document.documentElement.dataset.socotra = "true";
    return () => { delete document.documentElement.dataset.socotra; };
  }, []);
  return null;
}
