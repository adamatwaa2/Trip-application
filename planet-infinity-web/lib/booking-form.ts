export type BookingFormFieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox";

export type BookingFormField = {
  id: string;
  label: string;
  type: BookingFormFieldType;
  required?: boolean;
  help?: string;
  options?: string[];
};

export type BookingFormAnswer = string | string[] | boolean;

const FIELD_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FIELD_TYPES = new Set<BookingFormFieldType>([
  "text",
  "textarea",
  "select",
  "multiselect",
  "checkbox",
]);

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
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

    const options = Array.isArray(source.options)
      ? source.options.map((option) => clean(option, 120)).filter(Boolean).slice(0, 30)
      : [];
    if ((type === "select" || type === "multiselect") && options.length < 1) return null;

    fields.push({
      id,
      label,
      type,
      required: Boolean(source.required),
      ...(clean(source.help, 240) ? { help: clean(source.help, 240) } : {}),
      ...(type === "select" || type === "multiselect" ? { options } : {}),
    });
  }

  return fields;
}

export function bookingFormAnswersComplete(
  fields: BookingFormField[],
  answers: Record<string, BookingFormAnswer>,
) {
  return fields.every((field) => {
    if (!field.required) return true;
    const answer = answers[field.id];
    if (field.type === "checkbox") return answer === true;
    if (Array.isArray(answer)) return answer.length > 0;
    return typeof answer === "string" && answer.trim().length > 0;
  });
}
