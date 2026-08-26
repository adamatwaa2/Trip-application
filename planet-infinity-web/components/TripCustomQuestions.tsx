"use client";

import type { BookingFormAnswer, BookingFormField } from "@/lib/booking-form";

export function TripCustomQuestions({
  fields,
  answers,
  onChange,
}: {
  fields: BookingFormField[];
  answers: Record<string, BookingFormAnswer>;
  onChange: (id: string, answer: BookingFormAnswer) => void;
}) {
  return (
    <div className="pi-custom-questions">
      {fields.map((field) => {
        const answer = answers[field.id];
        return (
          <fieldset className="pi-custom-question" key={field.id}>
            <legend>{field.label}{field.required ? " *" : ""}</legend>
            {field.help ? <p className="pi-flow__hint">{field.help}</p> : null}
            {field.type === "text" ? (
              <input aria-label={field.label} value={typeof answer === "string" ? answer : ""} required={field.required} onChange={(event) => onChange(field.id, event.target.value)} />
            ) : null}
            {field.type === "textarea" ? (
              <textarea aria-label={field.label} value={typeof answer === "string" ? answer : ""} required={field.required} onChange={(event) => onChange(field.id, event.target.value)} />
            ) : null}
            {field.type === "select" ? (
              <select aria-label={field.label} value={typeof answer === "string" ? answer : ""} required={field.required} onChange={(event) => onChange(field.id, event.target.value)}>
                <option value="">Choose an option</option>
                {(field.options ?? []).map((option) => <option value={option} key={option}>{option}</option>)}
              </select>
            ) : null}
            {field.type === "multiselect" ? (
              <div className="pi-custom-options">
                {(field.options ?? []).map((option) => {
                  const selected = Array.isArray(answer) ? answer : [];
                  return <label className="agree-row" key={option}><input type="checkbox" checked={selected.includes(option)} onChange={(event) => onChange(field.id, event.target.checked ? [...selected, option] : selected.filter((value) => value !== option))} /><span>{option}</span></label>;
                })}
              </div>
            ) : null}
            {field.type === "checkbox" ? (
              <label className="agree-row"><input type="checkbox" checked={answer === true} onChange={(event) => onChange(field.id, event.target.checked)} /><span>Yes</span></label>
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
