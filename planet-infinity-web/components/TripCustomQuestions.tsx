"use client";

import { bookingOptionLabel, type BookingFormAnswer, type BookingFormField } from "@/lib/booking-form";

export function TripCustomQuestions({
  fields,
  answers,
  onChange,
  guestCount,
}: {
  fields: BookingFormField[];
  answers: Record<string, BookingFormAnswer>;
  onChange: (id: string, answer: BookingFormAnswer) => void;
  guestCount: number;
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
                {(field.options ?? []).map((option) => <option value={option.id} key={option.id}>{bookingOptionLabel(option)}</option>)}
              </select>
            ) : null}
            {field.type === "multiselect" ? (
              <div className="pi-custom-options">
                {(field.options ?? []).map((option) => {
                  const selected = Array.isArray(answer) ? answer : [];
                  return <label className="agree-row" key={option.id}><input type="checkbox" checked={selected.includes(option.id)} onChange={(event) => onChange(field.id, event.target.checked ? [...selected, option.id] : selected.filter((value) => value !== option.id))} /><span>{bookingOptionLabel(option)}</span></label>;
                })}
              </div>
            ) : null}
            {field.type === "quantity" ? (
              <div className="pi-quantity-options">
                {(field.options ?? []).map((option) => {
                  const unit = field.quantityUnit?.trim() || "person";
                  const quantities = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
                  const quantity = Math.max(0, Math.min(guestCount, Math.floor(Number(quantities[option.id]) || 0)));
                  const update = (next: number) => onChange(field.id, { ...quantities, [option.id]: Math.max(0, Math.min(guestCount, next)) });
                  return (
                    <div className="pi-quantity-option" key={option.id}>
                      <div><strong>{option.label}</strong>{option.priceEgp ? <span>+{option.priceEgp.toLocaleString("en-EG")} EGP / {unit}</span> : null}</div>
                      <div className="pi-stepper" aria-label={`${option.label} quantity`}>
                        <button type="button" onClick={() => update(quantity - 1)} disabled={quantity === 0} aria-label={`Remove one ${option.label}`}>−</button>
                        <output aria-live="polite">{quantity}</output>
                        <button type="button" onClick={() => update(quantity + 1)} disabled={quantity === guestCount} aria-label={`Add one ${option.label}`}>+</button>
                      </div>
                    </div>
                  );
                })}
                <p className="pi-flow__hint">Maximum per option: {guestCount}.</p>
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
