export type BookingFormFieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "quantity"
  | "checkbox";

export type BookingFormField = {
  id: string;
  label: string;
  type: BookingFormFieldType;
  required?: boolean;
  help?: string;
  quantityUnit?: string;
  options?: BookingFormOption[];
  /** false hides the question from guests while keeping it (and its saved
   *  configuration) intact in the admin panel — a pause, not a delete. */
  active?: boolean;
};

/**
 * How an option's price is charged.
 * - perGuest (default): priceEgp is added for each guest in the booking.
 * - totalSplit: priceEgp is the fixed total for the whole booking (e.g. a
 *   4x4 with a flat rental cost) — it is charged once and divided evenly
 *   across the guests, never multiplied by guest count.
 */
export type BookingOptionPriceMode = "perGuest" | "totalSplit";

/** A trip add-on. The price is always in EGP. */
export type BookingFormOption = {
  id: string;
  label: string;
  detail?: string;
  image?: string;
  priceEgp?: number;
  priceMode?: BookingOptionPriceMode;
  /** Accommodation-only grouping fields. They are ignored for normal add-ons. */
  stayId?: string;
  stayLabel?: string;
  stayDetail?: string;
  stayGallery?: string[];
  minGuests?: number;
  maxGuests?: number;
  /** false hides the choice from guests while keeping its saved
   *  configuration — a quick pause, not a delete. */
  active?: boolean;
};

export type BookingFormAnswer = string | string[] | boolean | Record<string, number>;

const FIELD_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FIELD_TYPES = new Set<BookingFormFieldType>([
  "text",
  "textarea",
  "select",
  "multiselect",
  "quantity",
  "checkbox",
]);

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeOptionImage(value: unknown) {
  const image = clean(value, 2000);
  return image.startsWith("/") || /^https:\/\//i.test(image) ? image : "";
}

export function normaliseBookingFormFields(value: unknown): BookingFormField[] | null {
  if (!Array.isArray(value) || value.length > 20) return null;
  const ids = new Set<string>();
  const fields: BookingFormField[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== "object") return null;
    const source = raw as Partial<BookingFormField>;
    const id = clean(source.id, 60);
    const label = clean(source.label, 160);
    const type = source.type;
    if (!id || !FIELD_ID.test(id) || ids.has(id) || !label || !type || !FIELD_TYPES.has(type)) {
      return null;
    }
    ids.add(id);

    const optionIds = new Set<string>();
    const options = Array.isArray(source.options)
      ? source.options.flatMap((rawOption, index) => {
          // Keep existing saved questions working while moving them to the
          // safer label + price structure.
          const legacyLabel = clean(rawOption, 120);
          const option = rawOption && typeof rawOption === "object"
            ? rawOption as Partial<BookingFormOption>
            : null;
          const label = option ? clean(option.label, 120) : legacyLabel;
          const id = option ? clean(option.id, 60) : `option-${index + 1}`;
          const price = option?.priceEgp;
          if (!label || !id || !FIELD_ID.test(id) || optionIds.has(id) || (price !== undefined && (!Number.isFinite(price) || price < 0))) return [];
          optionIds.add(id);
          const detail = option ? clean(option.detail, 240) : "";
          const image = option ? safeOptionImage(option.image) : "";
          const stayId = option ? clean(option.stayId, 60) : "";
          const stayLabel = option ? clean(option.stayLabel, 120) : "";
          const stayDetail = option ? clean(option.stayDetail, 240) : "";
          const stayGallery = option && Array.isArray(option.stayGallery)
            ? option.stayGallery.map(safeOptionImage).filter(Boolean).slice(0, 24)
            : [];
          const minGuests = option?.minGuests === undefined ? undefined : Math.floor(Number(option.minGuests));
          const maxGuests = option?.maxGuests === undefined ? undefined : Math.floor(Number(option.maxGuests));
          const priceMode = option?.priceMode === "totalSplit" ? "totalSplit" as const : undefined;
          const active = option?.active === false ? false : undefined;
          if ((stayId && !FIELD_ID.test(stayId))
            || (minGuests !== undefined && (!Number.isFinite(minGuests) || minGuests < 1 || minGuests > 80))
            || (maxGuests !== undefined && (!Number.isFinite(maxGuests) || maxGuests < 1 || maxGuests > 80))
            || (minGuests !== undefined && maxGuests !== undefined && minGuests > maxGuests)) return [];
          return [{
            id,
            label,
            ...(detail ? { detail } : {}),
            ...(image ? { image } : {}),
            ...(price && price > 0 ? { priceEgp: Math.round(price) } : {}),
            ...(price && price > 0 && priceMode ? { priceMode } : {}),
            ...(stayId ? { stayId } : {}),
            ...(stayLabel ? { stayLabel } : {}),
            ...(stayDetail ? { stayDetail } : {}),
            ...(stayGallery.length ? { stayGallery } : {}),
            ...(minGuests !== undefined ? { minGuests } : {}),
            ...(maxGuests !== undefined ? { maxGuests } : {}),
            ...(active === false ? { active: false as const } : {}),
          }];
        }).slice(0, 30)
      : [];
    if ((type === "select" || type === "multiselect" || type === "quantity") && options.length < 1) return null;

    fields.push({
      id,
      label,
      type,
      required: Boolean(source.required),
      ...(clean(source.help, 240) ? { help: clean(source.help, 240) } : {}),
      ...(type === "quantity" && clean(source.quantityUnit, 24) ? { quantityUnit: clean(source.quantityUnit, 24) } : {}),
      ...(type === "select" || type === "multiselect" || type === "quantity" ? { options } : {}),
      ...(source.active === false ? { active: false as const } : {}),
    });
  }

  return fields;
}

export function bookingOptionLabel(option: BookingFormOption, guestCount?: number) {
  if (!option.priceEgp) return option.label;
  if (option.priceMode === "totalSplit") {
    const perGuest = guestCount && guestCount > 0 ? Math.round(option.priceEgp / guestCount) : undefined;
    return perGuest
      ? `${option.label} · ${option.priceEgp.toLocaleString("en-EG")} EGP total (≈${perGuest.toLocaleString("en-EG")} EGP each)`
      : `${option.label} · ${option.priceEgp.toLocaleString("en-EG")} EGP total, split across guests`;
  }
  return `${option.label} · +${option.priceEgp.toLocaleString("en-EG")} EGP`;
}

export function bookingOptionPrice(
  fields: BookingFormField[],
  answers: Record<string, BookingFormAnswer>,
  guestCount = 1,
) {
  return fields.reduce((total, field) => {
    const answer = answers[field.id];
    if (field.type === "quantity" && answer && typeof answer === "object" && !Array.isArray(answer)) {
      return total + (field.options ?? []).reduce((sum, option) => {
        const quantity = Math.max(0, Math.floor(Number(answer[option.id]) || 0));
        const isAccommodation = field.quantityUnit?.trim().toLowerCase() === "accommodation";
        return sum + (option.priceEgp ?? 0) * quantity * (isAccommodation ? guestCount : 1);
      }, 0);
    }
    const ids = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [];
    return total + (field.options ?? [])
      .filter((option) => ids.includes(option.id))
      .reduce((sum, option) => sum + (option.priceMode === "totalSplit" ? (option.priceEgp ?? 0) : (option.priceEgp ?? 0) * guestCount), 0);
  }, 0);
}

export function bookingFormAnswersComplete(
  fields: BookingFormField[],
  answers: Record<string, BookingFormAnswer>,
  guestCount = 1,
) {
  return fields.every((field) => {
    const answer = answers[field.id];
    if (field.type === "quantity") {
      const quantity = answer && typeof answer === "object" && !Array.isArray(answer)
        ? Object.values(answer).reduce((sum, value) => sum + Math.max(0, Math.floor(Number(value) || 0)), 0)
        : 0;
      const isAccommodation = field.quantityUnit?.trim().toLowerCase() === "accommodation";
      return !field.required || (isAccommodation ? quantity === 1 : quantity > 0);
    }
    if (!field.required) return true;
    if (field.type === "checkbox") return answer === true;
    if (Array.isArray(answer)) return answer.length > 0;
    return typeof answer === "string" && answer.trim().length > 0;
  });
}
