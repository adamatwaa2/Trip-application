import type { BookingFormAnswer, BookingFormField } from "@/lib/booking-form";

/**
 * The Trip request form, per trip.
 *
 * Questions reuse the booking-form field shape (and its admin editor), but they
 * live in their own column: the booking form sells rooms and add-ons, this one
 * asks who is coming. Prices are ignored here.
 */

/** Only Planet Infinity brand colours — PI-BB-001. No free colour picking. */
export const REQUEST_ACCENTS = [
  { id: "orange", label: "Orange", cssVar: "--pi-orange" },
  { id: "ember", label: "Ember", cssVar: "--pi-ember" },
  { id: "flame", label: "Flame", cssVar: "--pi-flame" },
  { id: "gold", label: "Gold", cssVar: "--pi-gold" },
  { id: "cyan", label: "Cyan", cssVar: "--pi-cyan" },
  { id: "violet", label: "Violet", cssVar: "--pi-violet" },
] as const;

export type RequestAccentId = (typeof REQUEST_ACCENTS)[number]["id"];

export type RequestFormTheme = {
  accent?: RequestAccentId;
  image?: string;
};

const ACCENT_IDS = new Set<string>(REQUEST_ACCENTS.map((accent) => accent.id));

function safeImage(value: unknown): string {
  const image = typeof value === "string" ? value.trim().slice(0, 2000) : "";
  return image.startsWith("/") || /^https:\/\//i.test(image) ? image : "";
}

export function normaliseRequestFormTheme(value: unknown): RequestFormTheme {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as { accent?: unknown; image?: unknown };
  const accent = typeof source.accent === "string" && ACCENT_IDS.has(source.accent)
    ? (source.accent as RequestAccentId)
    : undefined;
  const image = safeImage(source.image);
  return { ...(accent ? { accent } : {}), ...(image ? { image } : {}) };
}

export function accentCssVar(accent: RequestAccentId | undefined): string {
  const match = REQUEST_ACCENTS.find((item) => item.id === accent);
  return `var(${match ? match.cssVar : "--pi-orange"})`;
}

/** A human-readable copy of the answers, so the admin panel is readable at a glance. */
export function labelRequestAnswers(
  fields: BookingFormField[],
  answers: Record<string, BookingFormAnswer>,
): Record<string, string> {
  const labelled: Record<string, string> = {};
  for (const field of fields) {
    const answer = answers[field.id];
    if (answer === undefined || answer === "" || answer === false) continue;
    const optionLabel = (id: string) =>
      (field.options ?? []).find((option) => option.id === id)?.label ?? id;

    if (typeof answer === "boolean") {
      labelled[field.label] = "Yes";
    } else if (Array.isArray(answer)) {
      if (!answer.length) continue;
      labelled[field.label] = answer.map(optionLabel).join(", ");
    } else if (typeof answer === "object") {
      const parts = Object.entries(answer)
        .filter(([, quantity]) => Number(quantity) > 0)
        .map(([id, quantity]) => `${optionLabel(id)} × ${quantity}`);
      if (!parts.length) continue;
      labelled[field.label] = parts.join(", ");
    } else {
      labelled[field.label] = field.options?.length ? optionLabel(answer) : answer;
    }
  }
  return labelled;
}
