"use client";

import { bookingOptionLabel, type BookingFormAnswer, type BookingFormField } from "@/lib/booking-form";

export function TripCustomQuestions({
  fields,
  answers,
  onChange,
  guestCount,
  basePrice = 0,
}: {
  fields: BookingFormField[];
  answers: Record<string, BookingFormAnswer>;
  onChange: (id: string, answer: BookingFormAnswer) => void;
  guestCount: number;
  basePrice?: number;
}) {
  const guestCountRequired = guestCount < 1 && fields.some((field) => field.type === "quantity");

  return (
    <div className="pi-custom-questions">
      {guestCountRequired ? (
        <div className="pi-addons-gate" role="status">
          <span>1</span>
          <div>
            <strong>Choose the number of guests first</strong>
          <p>Then you can add extras and choose the right accommodation for each guest.</p>
          </div>
        </div>
      ) : null}
      {fields.map((field) => {
        if (field.type === "quantity" && guestCount < 1) return null;

        const answer = answers[field.id];
        const fieldUnit = field.quantityUnit?.trim() || "person";
        const personBasedQuantity = fieldUnit.toLowerCase() === "person" || fieldUnit.toLowerCase() === "guest";
        const perGuestAccommodation = field.type === "quantity" && fieldUnit.toLowerCase() === "accommodation";
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
            {field.type === "quantity" && !perGuestAccommodation ? (
              <div className="pi-quantity-options">
                {(field.options ?? []).map((option) => {
                  const unit = fieldUnit;
                  const maxQuantity = personBasedQuantity ? guestCount : 20;
                  const quantities = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
                  const quantity = Math.max(0, Math.min(maxQuantity, Math.floor(Number(quantities[option.id]) || 0)));
                  const update = (next: number) => onChange(field.id, { ...quantities, [option.id]: Math.max(0, Math.min(maxQuantity, next)) });
                  return (
                    <div className={`pi-quantity-option${quantity > 0 ? " pi-quantity-option--selected" : ""}`} key={option.id}>
                      <div className="pi-quantity-option__details">
                        <strong>{option.label}</strong>
                        {option.priceEgp ? <span>+{option.priceEgp.toLocaleString("en-EG")} EGP / {unit}</span> : null}
                      </div>
                      {quantity === 0 ? (
                        <button type="button" className="pi-quantity-option__add" onClick={() => update(1)} aria-label={`Add ${option.label}`}>Add</button>
                      ) : (
                        <div className="pi-quantity-option__controls">
                          <span className="pi-quantity-option__count" aria-live="polite">{personBasedQuantity ? `${quantity} of ${guestCount} guest${guestCount === 1 ? "" : "s"}` : `${quantity} ${unit}${quantity === 1 ? "" : "s"}`}</span>
                          <div className="pi-stepper" aria-label={`${option.label} quantity`}>
                            <button type="button" onClick={() => update(quantity - 1)} aria-label={`Remove one ${option.label}`}>−</button>
                            <output>{quantity}</output>
                            <button type="button" onClick={() => update(quantity + 1)} disabled={quantity === maxQuantity} aria-label={`Add one ${option.label}`}>+</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <p className="pi-flow__hint">{personBasedQuantity ? `Tap Add for the extras you want. You can assign each extra to up to ${guestCount} guest${guestCount === 1 ? "" : "s"}.` : `Tap Add to choose the number of ${fieldUnit}s you need.`}</p>
              </div>
            ) : null}
            {perGuestAccommodation ? (
              <div className="pi-guest-accommodation-list">
                {Array.from({ length: guestCount }, (_, guestIndex) => {
                  const quantities = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
                  const selected = (field.options ?? []).flatMap((option) => Array.from({ length: Math.max(0, Math.floor(Number(quantities[option.id]) || 0)) }, () => option.id)).slice(0, guestCount);
                  const selectedId = selected[guestIndex] ?? "";
                  const update = (optionId: string) => {
                    const next = Array.from({ length: guestCount }, (_, index) => selected[index] ?? "");
                    next[guestIndex] = optionId;
                    onChange(field.id, Object.fromEntries((field.options ?? []).map((option) => [option.id, next.filter((id) => id === option.id).length])));
                  };
                  return (
                    <section className="pi-guest-accommodation" key={guestIndex}>
                      <div className="pi-guest-accommodation__head"><strong>Guest {guestIndex + 1}</strong><span>{selectedId ? "Accommodation selected" : "Choose accommodation"}</span></div>
                      <div className="pi-guest-accommodation__options">
                        {(field.options ?? []).map((option) => {
                          const selectedOption = selectedId === option.id;
                          return (
                            <label className={`pi-accommodation-choice${selectedOption ? " pi-accommodation-choice--selected" : ""}`} key={option.id}>
                              <input type="radio" name={`${field.id}-${guestIndex}`} value={option.id} checked={selectedOption} onChange={() => update(option.id)} />
                              {option.image ? <img src={option.image} alt="" /> : null}
                              <span className="pi-accommodation-choice__body">
                                <strong>{option.label}</strong>
                                {option.detail ? <small>{option.detail}</small> : null}
                                <b>{((option.priceEgp ?? 0) + basePrice).toLocaleString("en-EG")} EGP</b>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  );
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
