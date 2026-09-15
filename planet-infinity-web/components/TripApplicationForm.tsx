"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition, type CSSProperties } from "react";
import { createApplicationPhotoUploadTarget, submitPublicRequest } from "@/app/actions/requests";
import { PolicyAcceptance } from "@/components/PolicyAcceptance";
import {
  bookingFormAnswersComplete,
  type BookingFormAnswer,
  type BookingFormField,
} from "@/lib/booking-form";
import type { CatalogVisualTheme } from "@/lib/catalog-visual-theme";
import { labelRequestAnswers, type RequestFormTheme } from "@/lib/request-form";
import { createClient } from "@/lib/supabase/client";

type Props = {
  productId?: string;
  title: string;
  fields: BookingFormField[];
  formTheme: RequestFormTheme;
  identity?: CatalogVisualTheme;
};

function Field({
  field,
  answer,
  onChange,
}: {
  field: BookingFormField;
  answer: BookingFormAnswer | undefined;
  onChange: (answer: BookingFormAnswer) => void;
}) {
  const id = `application-${field.id}`;
  const options = (field.options ?? []).filter((option) => option.active !== false);

  if (field.type === "textarea") {
    return (
      <label className="pi-application-field" htmlFor={id}>
        <span>{field.label}{field.required ? <b>Required</b> : null}</span>
        {field.help ? <small>{field.help}</small> : null}
        <textarea id={id} required={field.required} value={typeof answer === "string" ? answer : ""} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="pi-application-field" htmlFor={id}>
        <span>{field.label}{field.required ? <b>Required</b> : null}</span>
        {field.help ? <small>{field.help}</small> : null}
        <select id={id} required={field.required} value={typeof answer === "string" ? answer : ""} onChange={(event) => onChange(event.target.value)}>
          <option value="">Choose one</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(answer) ? answer : [];
    return (
      <fieldset className="pi-application-options">
        <legend>{field.label}{field.required ? <b>Required</b> : null}</legend>
        {field.help ? <small>{field.help}</small> : null}
        <div>
          {options.map((option) => (
            <label key={option.id}>
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={(event) => onChange(event.target.checked ? [...selected, option.id] : selected.filter((value) => value !== option.id))}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="pi-application-check" htmlFor={id}>
        <input id={id} required={field.required} type="checkbox" checked={answer === true} onChange={(event) => onChange(event.target.checked)} />
        <span>{field.label}{field.help ? <small>{field.help}</small> : null}</span>
      </label>
    );
  }

  if (field.type === "quantity") {
    const quantities = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
    return (
      <fieldset className="pi-application-quantities">
        <legend>{field.label}{field.required ? <b>Required</b> : null}</legend>
        {options.map((option) => (
          <label key={option.id}>
            <span>{option.label}</span>
            <input type="number" min="0" max="20" value={quantities[option.id] ?? 0} onChange={(event) => onChange({ ...quantities, [option.id]: Math.max(0, Number(event.target.value) || 0) })} />
          </label>
        ))}
      </fieldset>
    );
  }

  return (
    <label className="pi-application-field" htmlFor={id}>
      <span>{field.label}{field.required ? <b>Required</b> : null}</span>
      {field.help ? <small>{field.help}</small> : null}
      <input id={id} required={field.required} value={typeof answer === "string" ? answer : ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function TripApplicationForm({ productId, title, fields, formTheme, identity }: Props) {
  const activeFields = fields.filter((field) => field.active !== false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, BookingFormAnswer>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [requestNumber, setRequestNumber] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const complete = fullName.trim().length > 1
    && /.+@.+\..+/.test(email)
    && phone.trim().length > 5
    && (!productId || photos.length >= 1)
    && accepted
    && bookingFormAnswersComplete(activeFields, answers);
  const background = formTheme.image || identity?.backgroundImage;
  const style = {
    "--pi-application-primary": identity?.primaryColor ?? "#f59b23",
    "--pi-application-secondary": identity?.secondaryColor ?? "#f6d08b",
    ...(background ? { "--pi-application-background": `url(${background})` } : {}),
  } as CSSProperties;

  if (requestNumber) {
    return (
      <main className="pi-trip-application pi-trip-application--success" style={style}>
        <section className="pi-application-success">
          <p>Application received</p>
          <h1>We have your story.</h1>
          <strong>{requestNumber}</strong>
          <p>The team will review it in the admin panel and accept or reject it from there.</p>
          <Link href="/trips">Back to trips</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="pi-trip-application" data-style={formTheme.style ?? "immersive"} style={style}>
      <header className="pi-application-hero">
        <div className="pi-application-hero__shade" />
        <Link href="/trips" className="pi-application-back">← Trips</Link>
        <div className="pi-application-hero__copy">
          {identity?.logo ? <Image src={identity.logo} alt={identity.logoAlt || `${title} logo`} width={180} height={180} sizes="(max-width: 720px) 120px, 180px" unoptimized /> : null}
          <div><p>Trip application</p><h1>{title}</h1><span>Tell us who you are. Every question below is set specifically for this trip.</span></div>
        </div>
      </header>

      <form
        className="pi-application-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!complete) return;
          setMessage(null);
          startTransition(async () => {
            try {
              const applicationPhotos = productId
                ? await Promise.all(photos.map(async (file) => {
                    const target = await createApplicationPhotoUploadTarget({ tripId: productId, mimeType: file.type, size: file.size });
                    if (!target.ok) throw new Error(target.error);
                    const { error: uploadError } = await createClient().storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type, cacheControl: "3600" });
                    if (uploadError) throw new Error("One of your photos could not be uploaded. Please try again.");
                    return { path: target.path, fileName: file.name };
                  }))
                : [];
              const result = await submitPublicRequest({
                requestType: "application",
                productId,
                subjectTitle: title,
                fullName,
                email,
                phone,
                termsAccepted: accepted,
                whatsappOptIn,
                selections: { applicationAnswers: labelRequestAnswers(activeFields, answers), productType: "trip", ...(applicationPhotos.length ? { applicationPhotos } : {}) },
              });
              if (result.ok) setRequestNumber(result.requestNumber);
              else setMessage(result.error);
            } catch (caught) {
              setMessage(caught instanceof Error ? caught.message : "Your application could not be sent. Please try again.");
            }
          });
        }}
      >
        <section className="pi-application-card">
          <p className="pi-application-kicker">01 · Your details</p>
          <h2>Start with the basics</h2>
          <div className="pi-application-grid">
            <label className="pi-application-field"><span>Full name <b>Required</b></span><input autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
            <label className="pi-application-field"><span>Mobile / WhatsApp <b>Required</b></span><input autoComplete="tel" inputMode="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
            <label className="pi-application-field pi-application-field--wide"><span>Email <b>Required</b></span><input autoComplete="email" inputMode="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          </div>
        </section>

        {productId ? (
          <section className="pi-application-card">
            <p className="pi-application-kicker">02 · Your photos</p>
            <h2>Let us put a face to the story</h2>
            <label className="pi-application-upload">
              <span>Upload one or two photos of yourself <b>Required</b></span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={(event) => {
                const selected = Array.from(event.currentTarget.files ?? []).slice(0, 2);
                if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
                  setMessage("Each photo must be 5 MB or smaller.");
                  setPhotos([]);
                  event.currentTarget.value = "";
                  return;
                }
                setPhotos(selected);
                setMessage(null);
              }} />
              <small>{photos.length ? photos.map((file) => file.name).join(" · ") : "Choose 1–2 clear photos · JPG, PNG or WebP · 5 MB maximum each"}</small>
              <em>Private — visible only to authorized Planet Infinity admins reviewing this application.</em>
            </label>
          </section>
        ) : null}

        {activeFields.length ? (
          <section className="pi-application-card">
            <p className="pi-application-kicker">{productId ? "03" : "02"} · This trip</p>
            <h2>A few questions for {title}</h2>
            <div className="pi-application-grid">
              {activeFields.map((field) => <Field key={field.id} field={field} answer={answers[field.id]} onChange={(answer) => setAnswers((current) => ({ ...current, [field.id]: answer }))} />)}
            </div>
          </section>
        ) : null}

        <section className="pi-application-card">
          <p className="pi-application-kicker">{productId ? "04" : "03"} · Send</p>
          <PolicyAcceptance checked={accepted} onChange={setAccepted} scope="application" />
          <label className="pi-application-check"><input type="checkbox" checked={whatsappOptIn} onChange={(event) => setWhatsappOptIn(event.target.checked)} /><span>Keep me updated on WhatsApp.</span></label>
          {message ? <p className="pi-application-error" role="alert">{message}</p> : null}
          <button type="submit" disabled={!complete || pending}>{pending ? "Sending…" : "Send application"}</button>
        </section>
      </form>
    </main>
  );
}
