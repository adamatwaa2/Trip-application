"use client";

import type { BookingFormField, BookingFormFieldType, BookingFormOption } from "@/lib/booking-form";
import { CATALOG_MEDIA_ACCEPT } from "@/lib/catalog-media";

const TYPE_LABELS: Record<BookingFormFieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  select: "One choice",
  multiselect: "Multiple choices",
  quantity: "Quantity add-on",
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

function nextOption(): BookingFormOption {
  return { id: `option-${crypto.randomUUID().slice(0, 8)}`, label: "" };
}

export function BookingFormBuilder({
  fields,
  onChange,
  uploading = false,
  onAccommodationImageUpload,
}: {
  fields: BookingFormField[];
  onChange: (fields: BookingFormField[]) => void;
  uploading?: boolean;
  onAccommodationImageUpload?: (fieldId: string, optionId: string, files: File[]) => Promise<void>;
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
        <article className={`pi-admin-form-field${field.active === false ? " pi-admin-form-field--inactive" : ""}`} key={field.id}>
          <div className="pi-admin-section__head">
            <strong>Question {index + 1}{field.active === false ? " (off)" : ""}</strong>
            <div className="pi-admin-inline-actions">
              <button type="button" onClick={() => update(index, { active: field.active === false ? true : false })}>
                {field.active === false ? "Turn on" : "Turn off"}
              </button>
              <button type="button" onClick={() => onChange(fields.filter((_, fieldIndex) => fieldIndex !== index))}>
                Remove
              </button>
            </div>
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
                  ...(type === "select" || type === "multiselect" || type === "quantity" ? { options: field.options?.length ? field.options : [nextOption()] } : { options: undefined }),
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
          {field.type === "select" || field.type === "multiselect" || field.type === "quantity" ? (
            <div className="pi-admin-option-builder">
              <p className="pi-admin-help">{field.type === "quantity" ? field.quantityUnit?.trim().toLowerCase() === "accommodation" ? "Guests choose one hotel and one room type for their whole group. The room price is charged per person, then multiplied by the guest count." : "Choose a unit such as person, tent or room. Person quantities are capped at the guest count; other units can be counted separately." : "A selected add-on price is charged per guest."}</p>
              {field.type === "quantity" ? <label>Quantity unit<input maxLength={24} value={field.quantityUnit ?? "person"} placeholder="person, tent, room…" onChange={(event) => update(index, { quantityUnit: event.target.value })} /></label> : null}
              {(field.options ?? []).map((option, optionIndex) => (
                <div className={`pi-admin-form__grid pi-admin-form__grid--two${option.active === false ? " pi-admin-form-field--inactive" : ""}`} key={option.id}>
                  <label>
                    Choice{option.active === false ? " (off)" : ""}
                    <input required maxLength={120} value={option.label} placeholder="e.g. Pottery workshop" onChange={(event) => update(index, { options: (field.options ?? []).map((current, currentIndex) => currentIndex === optionIndex ? { ...current, label: event.target.value } : current) })} />
                  </label>
                  <label>
                    Extra price (EGP) <span className="opt">optional</span>
                    <input type="number" min="0" step="1" value={option.priceEgp ?? ""} placeholder="0" onChange={(event) => update(index, { options: (field.options ?? []).map((current, currentIndex) => currentIndex === optionIndex ? { ...current, priceEgp: event.target.value === "" ? undefined : Number(event.target.value) } : current) })} />
                  </label>
                  {(field.type === "select" || field.type === "multiselect") && option.priceEgp ? (
                    <label>
                      How this price is charged
                      <select
                        value={option.priceMode === "totalSplit" ? "totalSplit" : "perGuest"}
                        onChange={(event) => update(index, { options: (field.options ?? []).map((current, currentIndex) => currentIndex === optionIndex ? { ...current, priceMode: event.target.value === "totalSplit" ? "totalSplit" : undefined } : current) })}
                      >
                        <option value="perGuest">Per guest — price × number of guests</option>
                        <option value="totalSplit">Fixed total — split evenly across the guests who book it (e.g. a 4x4 rental)</option>
                      </select>
                    </label>
                  ) : null}
                  <label className="pi-admin-check">
                    <input type="checkbox" checked={option.active !== false} onChange={(event) => update(index, { options: (field.options ?? []).map((current, currentIndex) => currentIndex === optionIndex ? { ...current, active: event.target.checked ? undefined : false } : current) })} />
                    Active — visible to guests
                </label>
                {field.type === "quantity" && field.quantityUnit?.trim().toLowerCase() === "accommodation" ? <label>
                    Room detail <span className="opt">optional</span>
                    <input maxLength={240} value={option.detail ?? ""} placeholder="e.g. Al Mamsha · breakfast included" onChange={(event) => update(index, { options: (field.options ?? []).map((current, currentIndex) => currentIndex === optionIndex ? { ...current, detail: event.target.value } : current) })} />
                  </label> : null}
                  {field.type === "quantity" && field.quantityUnit?.trim().toLowerCase() === "accommodation" ? <label>
                    Hotel name
                    <input maxLength={120} value={option.stayLabel ?? ""} placeholder="e.g. Hakuna Matata" onChange={(event) => update(index, { options: (field.options ?? []).map((current, currentIndex) => currentIndex === optionIndex ? { ...current, stayLabel: event.target.value } : current) })} />
                  </label> : null}
                  {field.type === "quantity" && field.quantityUnit?.trim().toLowerCase() === "accommodation" ? <label>
                    Hotel detail <span className="opt">optional</span>
                    <input maxLength={240} value={option.stayDetail ?? ""} placeholder="e.g. El Mamsha · breakfast included" onChange={(event) => update(index, { options: (field.options ?? []).map((current, currentIndex) => currentIndex === optionIndex ? { ...current, stayDetail: event.target.value } : current) })} />
                  </label> : null}
                  {field.type === "quantity" && field.quantityUnit?.trim().toLowerCase() === "accommodation" ? <label>
                    Minimum guests for this room
                    <input type="number" min="1" max="80" value={option.minGuests ?? ""} placeholder="e.g. 2" onChange={(event) => update(index, { options: (field.options ?? []).map((current, currentIndex) => currentIndex === optionIndex ? { ...current, minGuests: event.target.value === "" ? undefined : Number(event.target.value) } : current) })} />
                  </label> : null}
                  {field.type === "quantity" && field.quantityUnit?.trim().toLowerCase() === "accommodation" ? <label>
                    Maximum guests for this room
                    <input type="number" min="1" max="80" value={option.maxGuests ?? ""} placeholder="e.g. 6" onChange={(event) => update(index, { options: (field.options ?? []).map((current, currentIndex) => currentIndex === optionIndex ? { ...current, maxGuests: event.target.value === "" ? undefined : Number(event.target.value) } : current) })} />
                  </label> : null}
                  {field.type === "quantity" && field.quantityUnit?.trim().toLowerCase() === "accommodation" ? <div className="pi-admin-asset-actions">
                    <label className="pi-admin-upload">
                      <span>{uploading ? "Uploading…" : "Add hotel gallery photo"}</span>
                      <input
                        type="file"
                        accept={CATALOG_MEDIA_ACCEPT.image}
                        disabled={uploading || !onAccommodationImageUpload}
                        onChange={async (event) => {
                          const files = Array.from(event.currentTarget.files ?? []);
                          event.currentTarget.value = "";
                          if (files.length && onAccommodationImageUpload) await onAccommodationImageUpload(field.id, option.id, files.slice(0, 1));
                        }}
                      />
                    </label>
                    {(option.stayGallery ?? []).map((image) => <span className="pi-admin-gallery-preview" key={image}><img src={image} alt="" /><button type="button" onClick={() => update(index, { options: (field.options ?? []).map((current, currentIndex) => currentIndex === optionIndex ? { ...current, stayGallery: (current.stayGallery ?? []).filter((value) => value !== image) } : current) })}>Remove photo</button></span>)}
                  </div> : null}
                  <button type="button" onClick={() => update(index, { options: (field.options ?? []).filter((_, currentIndex) => currentIndex !== optionIndex) })}>Remove choice</button>
                </div>
              ))}
              <button type="button" onClick={() => update(index, { options: [...(field.options ?? []), nextOption()] })}>Add choice</button>
            </div>
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
