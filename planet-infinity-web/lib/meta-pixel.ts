type MetaPixelValue = string | number | boolean | string[] | number[] | undefined;

export type MetaPixelParameters = Record<string, MetaPixelValue>;

type MetaPixelFunction = (
  action: "track" | "trackCustom",
  eventName: string,
  parameters?: MetaPixelParameters,
) => void;

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
  }
}

function dispatchMetaEvent(
  action: "track" | "trackCustom",
  eventName: string,
  parameters?: MetaPixelParameters,
) {
  if (typeof window === "undefined") return;
  const send = () => window.fbq?.(action, eventName, parameters);
  if (window.fbq) {
    send();
    return;
  }
  window.addEventListener("meta-pixel-ready", send, { once: true });
}

export function trackMetaEvent(eventName: string, parameters?: MetaPixelParameters) {
  dispatchMetaEvent("track", eventName, parameters);
}

export function trackMetaCustomEvent(eventName: string, parameters?: MetaPixelParameters) {
  dispatchMetaEvent("trackCustom", eventName, parameters);
}
