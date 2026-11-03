import type { PlanetEvent } from "@/content/events";

const cairoDay = new Intl.DateTimeFormat("sv-SE", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" });

export function splitEvents(events: PlanetEvent[], now = new Date()) {
  const today = cairoDay.format(now);
  const upcoming: PlanetEvent[] = [];
  const past: { event: PlanetEvent; timestamp: number }[] = [];
  for (const event of events) {
    const end = Date.parse(event.endsAt ?? "");
    const start = Date.parse(event.startsAt ?? "");
    const finished = Number.isFinite(end)
      ? end <= now.getTime()
      : Number.isFinite(start) && cairoDay.format(start) < today;
    if (finished && !event.isDemo) past.push({ event, timestamp: Number.isFinite(end) ? end : start });
    else upcoming.push(event);
  }
  return { upcoming, past: past.sort((a, b) => b.timestamp - a.timestamp).map(({ event }) => event) };
}
