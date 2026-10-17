/** Catalogue event inputs and displays always use Cairo, regardless of server/browser timezone. */
export function cairoDateTimeInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function parseCairoDateTime(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return new Date(NaN);
  const target = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(target)) return new Date(NaN);
  let instant = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const local = cairoDateTimeInput(new Date(instant).toISOString());
    if (local === value) return new Date(instant);
    instant += target - Date.parse(`${local}:00Z`);
  }
  // Invalid calendar dates and skipped DST wall times must not silently shift.
  return new Date(NaN);
}
