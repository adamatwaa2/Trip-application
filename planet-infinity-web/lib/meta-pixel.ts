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

export function trackMetaEvent(eventName: string, parameters?: MetaPixelParameters) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", eventName, parameters);
}

export function trackMetaCustomEvent(eventName: string, parameters?: MetaPixelParameters) {
  if (typeof window === "undefined") return;
  window.fbq?.("trackCustom", eventName, parameters);
}
