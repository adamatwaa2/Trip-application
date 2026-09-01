"use client";

import { useMemo, useState } from "react";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { bookingOptionLabel, type BookingFormAnswer, type BookingFormField, type BookingFormOption } from "@/lib/booking-form";

type Stay = {
  id: string;
  label: string;
  detail?: string;
  options: BookingFormOption[];
  gallery: string[];
};

function accommodationStays(options: BookingFormOption[]) {
  const stays = new Map<string, Stay>();
  for (const option of options) {
    const label = option.stayLabel?.trim() || option.label.split("·")[0]?.trim() || option.label;
    const id = option.stayId?.trim() || label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || option.id;
    const current = stays.get(id) ?? { id, label, detail: option.stayDetail, options: [], gallery: [] };
    current.options.push(option);
    current.gallery.push(...(option.stayGallery ?? []), ...(option.image ? [option.image] : []));
    stays.set(id, current);
  }
  return Array.from(stays.values()).map((stay) => ({ ...stay, gallery: Array.from(new Set(stay.gallery)) }));
}

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
  const [openStay, setOpenStay] = useState<Record<string, string>>({});
  const guestCountRequired = guestCount < 1 && fields.some((field) => field.type === "quantity");

  return (
    <div className="pi-custom-questions">
      {guestCountRequired ? (
        <div className="pi-addons-gate" role="status">
          <span>1</span>
          <div>
            <strong>Choose the number of guests first</strong>
          <p>Then you can add extras and choose the right accommodation for your group.</p>
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
              <AccommodationPicker
                field={field}
                answer={answer}
                guestCount={guestCount}
                basePrice={basePrice}
                openStayId={openStay[field.id] ?? ""}
                onOpenStay={(stayId) => setOpenStay((current) => ({ ...current, [field.id]: stayId }))}
                onCloseStay={() => setOpenStay((current) => ({ ...current, [field.id]: "" }))}
                onChange={(next) => onChange(field.id, next)}
              />
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

function AccommodationPicker({
  field,
  answer,
  guestCount,
  basePrice,
  openStayId,
  onOpenStay,
  onCloseStay,
  onChange,
}: {
  field: BookingFormField;
  answer: BookingFormAnswer | undefined;
  guestCount: number;
  basePrice: number;
  openStayId: string;
  onOpenStay: (stayId: string) => void;
  onCloseStay: () => void;
  onChange: (answer: BookingFormAnswer) => void;
}) {
  const stays = useMemo(() => accommodationStays(field.options ?? []), [field.options]);
  const quantities = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
  const selectedId = (field.options ?? []).find((option) => Number(quantities[option.id]) > 0)?.id ?? "";
  const selectedOption = (field.options ?? []).find((option) => option.id === selectedId);
  const activeStay = stays.find((stay) => stay.id === openStayId);
  const relevantOptions = activeStay?.options.filter((option) => {
    const minimum = option.minGuests ?? 1;
    const maximum = option.maxGuests ?? 80;
    return guestCount >= minimum && guestCount <= maximum;
  }) ?? [];
  const choose = (optionId: string) => onChange(Object.fromEntries((field.options ?? []).map((option) => [option.id, option.id === optionId ? 1 : 0])));

  if (activeStay) {
    return (
      <section className="pi-accommodation-picker pi-accommodation-picker--open">
        <button type="button" className="pi-accommodation-picker__back" onClick={onCloseStay}>← All accommodation</button>
        <div className="pi-accommodation-picker__heading">
          <div><h3>{activeStay.label}</h3>{activeStay.detail ? <p>{activeStay.detail}</p> : null}</div>
          <span>{guestCount} guest{guestCount === 1 ? "" : "s"}</span>
        </div>
        {activeStay.gallery.length ? <GalleryLightbox images={activeStay.gallery.map((src, index) => ({ src, alt: `${activeStay.label} photo ${index + 1}` }))} /> : null}
        <div className="pi-accommodation-picker__rooms">
          {relevantOptions.map((option) => {
            const selected = option.id === selectedId;
            const perPerson = basePrice + (option.priceEgp ?? 0);
            return <button type="button" className={`pi-accommodation-room${selected ? " pi-accommodation-room--selected" : ""}`} key={option.id} onClick={() => choose(option.id)}>
              <span className="pi-accommodation-room__copy"><strong>{option.label.replace(/^.*?·\s*/, "")}</strong>{option.detail ? <small>{option.detail}</small> : null}</span>
              <span className="pi-accommodation-room__price"><b>{perPerson.toLocaleString("en-EG")} EGP</b><small>per person · {Math.round(perPerson * guestCount).toLocaleString("en-EG")} EGP total</small></span>
            </button>;
          })}
          {!relevantOptions.length ? <p className="pi-flow__hint">This stay has no room option for {guestCount} guests. Choose another stay or message us on WhatsApp for help.</p> : null}
        </div>
        <p className="pi-flow__hint">Every listed price is per person and includes accommodation, round-trip transportation and the full trip program.</p>
      </section>
    );
  }

  return (
    <div className="pi-accommodation-stays">
      {stays.map((stay) => {
        const possible = stay.options.filter((option) => guestCount >= (option.minGuests ?? 1) && guestCount <= (option.maxGuests ?? 80));
        const from = possible.length ? Math.min(...possible.map((option) => basePrice + (option.priceEgp ?? 0))) : null;
        const selected = stay.options.some((option) => option.id === selectedId);
        return <button type="button" className={`pi-accommodation-stay${selected ? " pi-accommodation-stay--selected" : ""}`} key={stay.id} onClick={() => onOpenStay(stay.id)}>
          <span><strong>{stay.label}</strong>{stay.detail ? <small>{stay.detail}</small> : null}</span>
          <span className="pi-accommodation-stay__price">{from !== null ? <><b>From {from.toLocaleString("en-EG")} EGP</b><small>per person</small></> : <small>Contact us for this group size</small>}</span>
        </button>;
      })}
      {selectedOption ? <p className="pi-accommodation-stays__selected">Selected: <strong>{selectedOption.label}</strong></p> : null}
      <p className="pi-flow__hint">Choose one stay for your whole group, then choose the room type that fits your guest count.</p>
    </div>
  );
}
