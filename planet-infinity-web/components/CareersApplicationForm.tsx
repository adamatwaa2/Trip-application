"use client";

import { useState, useTransition } from "react";
import { createCareerPhotoUploadTarget, submitPublicRequest } from "@/app/actions/requests";
import {
  bookingFormAnswersComplete,
  type BookingFormAnswer,
  type BookingFormField,
} from "@/lib/booking-form";
import { labelRequestAnswers } from "@/lib/request-form";
import { createClient } from "@/lib/supabase/client";

type Basics = { fullName: string; birthDate: string; phone: string; email: string; location: string; instagram: string };
const EMPTY: Basics = { fullName: "", birthDate: "", phone: "", email: "", location: "", instagram: "" };

function CareerQuestion({ field, answer, onChange }: { field: BookingFormField; answer?: BookingFormAnswer; onChange: (value: BookingFormAnswer) => void }) {
  const options = (field.options ?? []).filter((option) => option.active !== false);
  const id = `career-${field.id}`;
  if (field.type === "textarea") return <label>{field.label}{field.required ? <span className="opt"> (required)</span> : null}{field.help ? <small>{field.help}</small> : null}<textarea id={id} required={field.required} rows={5} value={typeof answer === "string" ? answer : ""} onChange={(event) => onChange(event.target.value)} /></label>;
  if (field.type === "text") return <label>{field.label}{field.required ? <span className="opt"> (required)</span> : null}{field.help ? <small>{field.help}</small> : null}<input id={id} required={field.required} value={typeof answer === "string" ? answer : ""} onChange={(event) => onChange(event.target.value)} /></label>;
  if (field.type === "checkbox") return <label className="agree-row"><input id={id} type="checkbox" required={field.required} checked={answer === true} onChange={(event) => onChange(event.target.checked)} /><span>{field.label}{field.help ? <small>{field.help}</small> : null}</span></label>;
  if (field.type === "quantity") {
    const values = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
    return <fieldset className="pi-careers-choice"><legend>{field.label}</legend><div className="pi-careers-quantity">{options.map((option) => <label key={option.id}>{option.label}<input type="number" min="0" max="20" value={values[option.id] ?? 0} onChange={(event) => onChange({ ...values, [option.id]: Math.max(0, Number(event.target.value) || 0) })} /></label>)}</div></fieldset>;
  }
  const selected = Array.isArray(answer) ? answer : typeof answer === "string" && answer ? [answer] : [];
  const multiple = field.type === "multiselect";
  return <fieldset className="pi-careers-choice"><legend>{field.label}{field.required ? <span className="opt"> (required)</span> : null}</legend>{field.help ? <small>{field.help}</small> : null}<div className="chip-group">{options.map((option) => {
    const active = selected.includes(option.id);
    return <button key={option.id} type="button" className={`chip${active ? " selected" : ""}`} aria-pressed={active} onClick={() => onChange(multiple ? (active ? selected.filter((value) => value !== option.id) : [...selected, option.id]) : option.id)}>{option.label}</button>;
  })}</div></fieldset>;
}

export function CareersApplicationForm({ fields }: { fields: BookingFormField[] }) {
  const activeFields = fields.filter((field) => field.active !== false);
  const [basics, setBasics] = useState(EMPTY);
  const [answers, setAnswers] = useState<Record<string, BookingFormAnswer>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const update = (key: keyof Basics, value: string) => setBasics((current) => ({ ...current, [key]: value }));
  const canSubmit = basics.fullName.trim().length > 1 && basics.phone.trim().length > 5 && basics.email.includes("@") && basics.location.trim().length > 1 && agreed && bookingFormAnswersComplete(activeFields, answers);

  async function uploadPhotos() {
    return Promise.all(photos.map(async (file) => {
      const target = await createCareerPhotoUploadTarget({ mimeType: file.type, size: file.size });
      if (!target.ok) throw new Error(target.error);
      const { error: uploadError } = await createClient().storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw new Error("One of the photos could not be uploaded. Please try again.");
      return { path: target.path, fileName: file.name };
    }));
  }

  if (reference) return <div className="pi-careers-success" role="status"><span aria-hidden="true">✓</span><h2>Your story is with us.</h2><p>Thanks, {basics.fullName.split(" ")[0]}. The team will review your application and contact you if there is a match.</p><strong>Reference: {reference}</strong></div>;

  return <form className="pi-careers-form" onSubmit={(event) => {
    event.preventDefault();
    if (!canSubmit || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const careerPhotos = await uploadPhotos();
        const result = await submitPublicRequest({
          requestType: "application", externalSubjectId: "careers", subjectSlug: "careers", subjectTitle: `Careers — ${basics.fullName}`,
          fullName: basics.fullName, email: basics.email, phone: basics.phone, termsAccepted: agreed, whatsappOptIn,
          notes: `CAREER APPLICATION — ${basics.fullName}`,
          selections: { kind: "career", birthDate: basics.birthDate, location: basics.location, instagram: basics.instagram, answers: labelRequestAnswers(activeFields, answers), careerPhotos },
        });
        if (!result.ok) throw new Error(result.error);
        setReference(result.requestNumber);
      } catch (caught) { setError(caught instanceof Error ? caught.message : "The application could not be sent."); }
    });
  }}>
    <section className="pi-careers-form__section"><header><b>01</b><div><h2>The basics</h2><p>So we can actually reach you</p></div></header>
      <label>Full name<input required autoComplete="name" placeholder="e.g. Sarah Ahmed" value={basics.fullName} onChange={(event) => update("fullName", event.target.value)} /></label>
      <label>Date of birth <span className="opt">(optional)</span><span className="pi-careers-date"><input type="date" value={basics.birthDate} onChange={(event) => update("birthDate", event.target.value)} /></span></label>
      <div className="pi-careers-form__two"><label>Mobile / WhatsApp<input required type="tel" autoComplete="tel" placeholder="+20 1xxxxxxxxx" value={basics.phone} onChange={(event) => update("phone", event.target.value)} /></label><label>Email<input required type="email" autoComplete="email" placeholder="you@email.com" value={basics.email} onChange={(event) => update("email", event.target.value)} /></label></div>
      <label>Where are you based?<input required autoComplete="address-level2" placeholder="e.g. Cairo, Giza" value={basics.location} onChange={(event) => update("location", event.target.value)} /></label>
      <label>Instagram <span className="opt">(optional)</span><input placeholder="@username" value={basics.instagram} onChange={(event) => update("instagram", event.target.value)} /></label>
    </section>

    <section className="pi-careers-form__section"><header><b>02</b><div><h2>Your application</h2><p>Every question here can be edited in the admin panel</p></div></header>
      {activeFields.map((field) => <CareerQuestion key={field.id} field={field} answer={answers[field.id]} onChange={(value) => setAnswers((current) => ({ ...current, [field.id]: value }))} />)}
    </section>

    <section className="pi-careers-form__section"><header><b>03</b><div><h2>Show us who you are</h2><p>A face for the story, not another CV</p></div></header>
      <label className="pi-careers-upload"><span>Upload one or two photos <span className="opt">(optional)</span></span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => {
        const selected = Array.from(event.currentTarget.files ?? []).slice(0, 2);
        if (selected.some((file) => file.size > 5 * 1024 * 1024)) { setError("Each photo must be 5 MB or smaller."); event.currentTarget.value = ""; return; }
        setPhotos(selected); setError(null);
      }} /><small>{photos.length ? photos.map((file) => file.name).join(" · ") : "JPG, PNG or WebP · maximum 5 MB each"}</small><em>Private — visible only to authorized Planet Infinity admins.</em></label>
    </section>

    <section className="pi-careers-form__section"><header><b>04</b><div><h2>Send it</h2><p>We will review it privately</p></div></header>
      <label className="agree-row"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>I&apos;m happy for Planet Infinity to keep my details on file and contact me about working together.</span></label>
      <label className="agree-row"><input type="checkbox" checked={whatsappOptIn} onChange={(event) => setWhatsappOptIn(event.target.checked)} /><span>You can reach me about this application on WhatsApp.</span></label>
      {error ? <p className="pi-flow__error" role="alert">{error}</p> : null}
      <button className="submit-btn" type="submit" disabled={!canSubmit || pending}>{pending ? "Sending your application…" : "Send my application"}</button>
      <p className="pi-careers-form__note">No CV needed. If we want to take it further, we&apos;ll ask you for the rest directly.</p>
    </section>
  </form>;
}
