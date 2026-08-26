"use client";

import type { BookingFormField, BookingFormFieldType } from "@/lib/booking-form";

const TYPE_LABELS: Record<BookingFormFieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  select: "One choice",
  multiselect: "Multiple choices",
  checkbox: "Yes / no checkbox",
};

function nextField(): BookingFormField {
  return {
    id: `question-${crypto.randomUUID().slice(0, 8)}`,
    label: "",
    type: "text",
    required: false,
  };
}

export function BookingFormBuilder({
  fields,
  onChange,
}: {
  fields: BookingFormField[];
  onChange: (fields: BookingFormField[]) => void;
}) {
  function update(index: number, patch: Partial<BookingFormField>) {
    onChange(fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field));
  }

  return (
    <div className="pi-admin-form-builder">
      <p className="pi-admin-help">
        Full name, email, phone, guest count, notes, policies, and payment are fixed.
        Add only the questions that change for this trip.
      </p>
      {fields.map((field, index) => (
        <article className="pi-admin-form-field" key={field.id}>
          <div className="pi-admin-section__head">
            <strong>Question {index + 1}</strong>
            <button type="button" onClick={() => onChange(fields.filter((_, fieldIndex) => fieldIndex !== index))}>
              Remove
            </button>
          </div>
          <div className="pi-admin-form__grid pi-admin-form__grid--two">
            <label>
              Question
              <input required maxLength={160} value={field.label} onChange={(event) => update(index, { label: event.target.value })} placeholder="e.g. Preferred meal" />
            </label>
            <label>
              Answer type
              <select value={field.type} onChange={(event) => {
                const type = event.target.value as BookingFormFieldType;
                update(index, {
                  type,
                  ...(type === "select" || type === "multiselect" ? { options: field.options?.length ? field.options : [""] } : { options: undefined }),
                });
              }}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <label>
            Help text <span className="opt">(optional)</span>
            <input maxLength={240} value={field.help ?? ""} onChange={(event) => update(index, { help: event.target.value })} />
          </label>
          {field.type === "select" || field.type === "multiselect" ? (
            <label>
              Choices — one per line
              <textarea
                required
                value={(field.options ?? []).join("\n")}
                onChange={(event) => update(index, { options: event.target.value.split("\n") })}
                placeholder={"Standard meal\nVegetarian\nVegan"}
              />
            </label>
          ) : null}
          <label className="pi-admin-check">
            <input type="checkbox" checked={Boolean(field.required)} onChange={(event) => update(index, { required: event.target.checked })} />
            Required before the booking can be submitted
          </label>
        </article>
      ))}
      <button className="pi-admin-button pi-admin-button--secondary" type="button" disabled={fields.length >= 20} onClick={() => onChange([...fields, nextField()])}>
        Add trip question
      </button>
    </div>
  );
}
