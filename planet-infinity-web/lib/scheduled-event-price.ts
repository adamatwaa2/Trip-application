export type EventPriceSchedule = { before: number; after: number; changesAt: string };
export function eventPriceSchedule(media: unknown): EventPriceSchedule | undefined {
  if (!media || typeof media !== "object") return;
  const value = (media as Record<string, unknown>).priceSchedule;
  if (!value || typeof value !== "object") return;
  const s = value as Record<string, unknown>;
  if (typeof s.before !== "number" || !Number.isFinite(s.before) || s.before < 0 ||
      typeof s.after !== "number" || !Number.isFinite(s.after) || s.after < 0 ||
      typeof s.changesAt !== "string" || !Number.isFinite(Date.parse(s.changesAt))) return;
  return { before: s.before, after: s.after, changesAt: s.changesAt };
}
export function eventPriceAt(fallback: number | null | undefined, media: unknown, now = Date.now()): number | undefined {
  const schedule = eventPriceSchedule(media);
  return schedule ? (now < Date.parse(schedule.changesAt) ? schedule.before : schedule.after) : fallback ?? undefined;
}
