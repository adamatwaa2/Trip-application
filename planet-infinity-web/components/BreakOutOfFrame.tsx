"use client";

import { useEffect } from "react";

/**
 * The card form runs in a frame on our own pages, so the provider's redirect
 * after payment lands inside that frame. This lifts the result back to the
 * full window, where the guest expects it. Both documents are ours, so the
 * top-level navigation is same-origin.
 */
export function BreakOutOfFrame() {
  useEffect(() => {
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.replace(window.location.href);
      }
    } catch {
      // A cross-origin top window cannot be navigated; the result stays in the
      // frame, which is still readable.
    }
  }, []);

  return null;
}
