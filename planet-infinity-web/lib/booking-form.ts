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
};

/** A trip add-on. The price is always in EGP and is added per guest. */
export type BookingFormOption = {
  id: string;
  label: string;
  detail?: string;
  image?: string;
  priceEgp?: number;
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
          return [{
            id,
            label,
            ...(detail ? { detail } : {}),
            ...(image ? { image } : {}),
            ...(price && price > 0 ? { priceEgp: Math.round(price) } : {}),
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
    });
  }

  return fields;
}

export function bookingOptionLabel(option: BookingFormOption) {
  return option.priceEgp ? `${option.label} · +${option.priceEgp.toLocaleString("en-EG")} EGP` : option.label;
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
        return sum + (option.priceEgp ?? 0) * quantity;
      }, 0);
    }
    const ids = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [];
    return total + (field.options ?? [])
      .filter((option) => ids.includes(option.id))
      .reduce((sum, option) => sum + (option.priceEgp ?? 0) * guestCount, 0);
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
      return !field.required || (isAccommodation ? quantity === guestCount : quantity > 0);
    }
    if (!field.required) return true;
    if (field.type === "checkbox") return answer === true;
    if (Array.isArray(answer)) return answer.length > 0;
    return typeof answer === "string" && answer.trim().length > 0;
  });
}
