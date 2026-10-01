"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createRecruitmentUploadTarget, submitRecruitmentApplication } from "@/app/actions/recruitment";
import { Button } from "@/components/Button";
import {
  getRecruitmentCategory,
  getRecruitmentRole,
  getRecruitmentWorld,
  commonRecruitmentQuestions,
  recruitmentCategories,
  recruitmentWorlds,
  worldCrewQuestions,
  type RecruitmentQuestion,
} from "@/content/recruitment";
import { planetInfinityBuilds } from "@/content/explore-builds";
import { createClient } from "@/lib/supabase/client";

type FormState = {
  category: string; world: string; role: string; fullName: string; email: string; phone: string; age: string;
  city: string; country: string; currentBase: string; egyptBased: string; attendEgypt: string; workMode: string;
  instagram: string; tiktok: string; linkedin: string; portfolio: string; about: string; similarBefore: string;
  answers: Record<string, string>; termsAccepted: boolean;
};

const initial: FormState = {
  category: "", world: "", role: "", fullName: "", email: "", phone: "", age: "", city: "", country: "Egypt",
  currentBase: "", egyptBased: "", attendEgypt: "", workMode: "", instagram: "", tiktok: "", linkedin: "",
  portfolio: "", about: "", similarBefore: "", answers: {}, termsAccepted: false,
};
const storageKey = "planet-infinity-recruitment-draft-v1";
const stepNames = ["Choose your place", "About you", "Review & send"];

function Field({ label, value, onChange, type = "text", required, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="pi-join-field"><span>{label}{required ? <b> *</b> : null}</span><input type={type} min={type === "number" ? 1 : undefined} max={type === "number" ? 120 : undefined} maxLength={500} value={value} required={required} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="pi-join-field"><span>{label} <b>*</b></span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Choose one</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function Choice({ label, value, selected, onClick, compact = false }: { label: string; value?: string; selected: boolean; onClick: () => void; compact?: boolean }) {
  return <button className={`pi-join-choice${selected ? " is-selected" : ""}${compact ? " pi-join-choice--compact" : ""}`} type="button" aria-pressed={selected} onClick={onClick}><span className="pi-join-choice__mark" aria-hidden="true">{selected ? "✓" : ""}</span><strong>{label}</strong>{value ? <small>{value}</small> : null}</button>;
}

const previewAnswers = Object.fromEntries([...commonRecruitmentQuestions, ...worldCrewQuestions, ...recruitmentCategories.flatMap((category) => category.roles.flatMap((role) => role.questions ?? []))].map((question) => [question.id, question.options?.[0] ?? "A focused preview answer for the Planet Infinity team."]));

export function RecruitmentExperience({ previewMode, initialPreview, careersCopy }: { previewMode: boolean; initialPreview?: { step: number; world: string }; careersCopy: { eyebrow: string; title: string; subtitle: string; lede: string } }) {
  const [step, setStep] = useState(initialPreview?.step ?? 0);
  const [form, setForm] = useState<FormState>(() => {
    if (initialPreview) return { ...initial, category: "world-crew", world: initialPreview.world, role: "content-storyteller", fullName: "Preview Candidate", email: "preview@example.com", phone: "+20 100 000 0000", age: "25", city: "Cairo", country: "Egypt", currentBase: "Cairo, Egypt", egyptBased: "Yes", attendEgypt: "Yes", workMode: "Flexible", instagram: "https://instagram.com/preview", portfolio: "https://example.com", about: "I build energetic travel stories and community-first content for memorable experiences.", similarBefore: "Yes — I have worked on live experiences, short-form content and on-ground event coverage.", answers: previewAnswers, termsAccepted: true };
    return initial;
  });
  const [restored, setRestored] = useState(false);
  const [draftId] = useState(() => crypto.randomUUID());
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [isPending, startTransition] = useTransition();
  const category = getRecruitmentCategory(form.category);
  const role = getRecruitmentRole(form.category, form.role);
  const world = form.category === "world-crew" ? getRecruitmentWorld(form.world) : undefined;
  const tailoredQuestions = useMemo(() => [...(form.category === "world-crew" ? worldCrewQuestions : []), ...(role?.questions ?? [])], [form.category, role]);
  const questions = useMemo(() => [...commonRecruitmentQuestions, ...tailoredQuestions], [tailoredQuestions]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!initialPreview) {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
          if (saved && typeof saved === "object" && getRecruitmentCategory(saved.category)) {
            const safe = { ...initial };
            for (const key of Object.keys(initial) as (keyof FormState)[]) {
              if (key !== "answers" && key !== "termsAccepted" && typeof saved[key] === "string") Object.assign(safe, { [key]: saved[key] });
            }
            if (saved.answers && typeof saved.answers === "object") safe.answers = Object.fromEntries(Object.entries(saved.answers).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
            setForm(safe);
          }
        } catch { /* Draft storage is optional. */ }
      }
      setRestored(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [initialPreview]);

  useEffect(() => {
    if (!restored || initialPreview || reference) return;
    try { localStorage.setItem(storageKey, JSON.stringify(form)); } catch { /* Keep the form usable without storage. */ }
  }, [form, restored, initialPreview, reference]);

  const set = (key: keyof FormState, value: FormState[keyof FormState]) => setForm((current) => ({ ...current, [key]: value }));
  const answer = (id: string, value: string) => setForm((current) => ({ ...current, answers: { ...current.answers, [id]: value } }));

  const canContinue = () => {
    if (step === 0) return Boolean(form.category && form.role && (form.category !== "world-crew" || form.world));
    if (step === 1) {
      const personalComplete = form.fullName.trim().length > 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) && form.phone.trim().length > 5 && Number.isInteger(Number(form.age)) && Number(form.age) > 0 && Number(form.age) <= 120 && form.city.trim().length > 1 && form.country.trim().length > 1 && Boolean(form.egyptBased && form.attendEgypt && form.workMode) && form.about.trim().length > 20;
      const answersComplete = questions.filter((item) => item.required).every((item) => form.answers[item.id]?.trim());
      return personalComplete && answersComplete;
    }
    return form.termsAccepted;
  };

  const next = () => {
    if (!canContinue()) { setError(step === 0 ? "Choose a path, a role and a world if needed." : "Complete the required fields marked with *."); return; }
    setError("");
    if (step === 1 && !form.currentBase) setForm((current) => ({ ...current, currentBase: `${current.city}, ${current.country}` }));
    setStep((value) => Math.min(2, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => { setError(""); setStep((value) => Math.max(0, value - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  async function upload(file: File, id: string) {
    const target = await createRecruitmentUploadTarget({ draftId: id, mimeType: file.type, size: file.size });
    if (!target.ok) throw new Error(target.error);
    const { error: uploadError } = await createClient().storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type, cacheControl: "3600" });
    if (uploadError) throw new Error("The file could not be uploaded. Please try again.");
    return { kind: target.kind, path: target.path, fileName: file.name };
  }

  function choosePhoto(file: File | null) {
    setPhoto(null);
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG or WebP photo up to 5 MB.");
      return;
    }
    setPhoto(file);
  }

  function submit() {
    if (!canContinue() || !draftId) { setError("Please confirm the information and privacy policy."); return; }
    startTransition(async () => {
      setError("");
      try {
        const uploads = previewMode || !photo ? [] : [await upload(photo, draftId)];
        const result = await submitRecruitmentApplication({ draftId, ...form, currentBase: form.currentBase || `${form.city}, ${form.country}`, uploads });
        if (!result.ok) throw new Error(result.error);
        try { localStorage.removeItem(storageKey); } catch { /* A successful submission stays successful without storage. */ }
        setReference(result.requestNumber);
      } catch (caught) { setError(caught instanceof Error ? caught.message : "The application could not be sent."); }
    });
  }

  if (reference) return <section className="pi-join-success" aria-live="polite"><span aria-hidden="true">✓</span><p>APPLICATION RECEIVED</p><h1>Thank you, {form.fullName.split(" ")[0]}.</h1><p>We’ll review your application and contact you if there’s a good fit.</p><small>{previewMode ? "Local preview — nothing was uploaded" : `Reference ${reference}`}</small><Link className="pi-btn pi-btn--primary" href="/">Back to Planet Infinity</Link></section>;

  return <div className="pi-join">
    <section className={`pi-join-intro${step > 0 ? " pi-join-intro--compact" : ""}`}><div className="pi-container pi-container--default"><p className="pi-join-eyebrow">{careersCopy.eyebrow}</p><h1>{step === 0 ? careersCopy.title : "Your application."}</h1>{step === 0 ? <><h2>{careersCopy.subtitle}</h2><p>{careersCopy.lede}</p></> : <p>{role?.title ?? "A place for what you can bring."}</p>}</div></section>

    {step === 0 ? <aside className="pi-join-build-note"><div className="pi-container pi-container--default"><span>WHAT WE’RE BUILDING</span><p>{planetInfinityBuilds.map((item) => item.title).join(" · ")}</p><Link href="/explore">Explore the bigger picture <span aria-hidden="true">↗</span></Link></div></aside> : null}

    <div className="pi-join-main pi-container pi-container--default" id="join-flow">
      <ol className="pi-join-steps" aria-label="Application progress">{stepNames.map((name, index) => <li key={name} className={index === step ? "is-current" : index < step ? "is-done" : ""} aria-current={index === step ? "step" : undefined}><span>{index < step ? "✓" : index + 1}</span><b>{name}</b></li>)}</ol>

      {step === 0 ? <section className="pi-join-stage"><header className="pi-join-stage__header"><p>STEP 1</p><h2>Where do you see yourself?</h2><span>Choose one path, then the role that feels closest to you.</span></header>
        <div className="pi-join-block"><h3>Choose a path</h3><div className="pi-join-categories">{recruitmentCategories.map((item) => <Choice key={item.id} label={item.title} value={item.description} selected={form.category === item.id} onClick={() => setForm((current) => ({ ...current, category: item.id, world: "", role: "" }))} />)}</div></div>
        {form.category === "world-crew" ? <div className="pi-join-block"><h3>Choose a world</h3><p className="pi-join-block__hint">Pick the experience you’d be excited to help create.</p><div className="pi-join-worlds">{recruitmentWorlds.map((item, index) => <button type="button" key={item.id} className={`pi-join-world${form.world === item.id ? " is-selected" : ""}`} aria-pressed={form.world === item.id} onClick={() => set("world", item.id)}><span className="pi-join-world__index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span><strong>{item.title}</strong><small>{item.subtitle}</small></span><i aria-hidden="true">{form.world === item.id ? "✓" : ""}</i></button>)}</div></div> : null}
        {category ? <div className="pi-join-block"><h3>Choose a role</h3><div className="pi-join-roles">{category.roles.map((item) => <Choice compact key={item.id} label={item.title} value={item.description} selected={form.role === item.id} onClick={() => set("role", item.id)} />)}</div></div> : null}
      </section> : null}

      {step === 1 ? <section className="pi-join-stage"><header className="pi-join-stage__header"><p>STEP 2</p><h2>Tell us about you.</h2><span>Short, honest answers are perfect. Fields marked * are required.</span></header>
        <div className="pi-join-form-section"><h3>The basics</h3><div className="pi-join-form-grid"><Field label="Full name" value={form.fullName} onChange={(value) => set("fullName", value)} required /><Field label="Email" type="email" value={form.email} onChange={(value) => set("email", value)} required /><Field label="Phone / WhatsApp" type="tel" value={form.phone} onChange={(value) => set("phone", value)} required /><Field label="Age" type="number" value={form.age} onChange={(value) => set("age", value)} required /><Field label="City" value={form.city} onChange={(value) => set("city", value)} required /><Field label="Country" value={form.country} onChange={(value) => set("country", value)} required /></div></div>
        <div className="pi-join-form-section"><h3>Availability</h3><div className="pi-join-form-grid pi-join-form-grid--three"><SelectField label="Based in Egypt?" value={form.egyptBased} options={["Yes", "No"]} onChange={(value) => set("egyptBased", value)} /><SelectField label="Can attend in Egypt?" value={form.attendEgypt} options={["Yes", "No", "It depends"]} onChange={(value) => set("attendEgypt", value)} /><SelectField label="Work setup" value={form.workMode} options={["Egypt-based", "Remote", "Flexible"]} onChange={(value) => set("workMode", value)} /></div></div>
        <div className="pi-join-form-section"><h3>Your application</h3><p className="pi-join-block__hint">Only the questions marked * are required. Everything else is there if you feel like sharing.</p><div className="pi-join-long-form"><label className="pi-join-field"><span>Tell us about yourself <b>*</b></span><textarea maxLength={2000} value={form.about} onChange={(event) => set("about", event.target.value)} rows={4} placeholder="Who are you when nobody is reading a job title?" /></label><label className="pi-join-field"><span>Worked in trips, events or hospitality before? <small>Optional</small></span><textarea maxLength={2000} value={form.similarBefore} onChange={(event) => set("similarBefore", event.target.value)} rows={3} placeholder="Share briefly if you want to." /></label>{commonRecruitmentQuestions.map((question) => <Question key={question.id} question={question} value={form.answers[question.id] ?? ""} onChange={(value) => answer(question.id, value)} />)}{tailoredQuestions.length ? <details className="pi-join-role-questions"><summary>Questions for {role?.title}<span>Optional</span></summary><div>{tailoredQuestions.map((question) => <Question key={question.id} question={question} value={form.answers[question.id] ?? ""} onChange={(value) => answer(question.id, value)} />)}</div></details> : null}</div></div>
        <details className="pi-join-optional"><summary>Links & portfolio <span>Optional</span></summary><div className="pi-join-form-grid"><Field label="Portfolio / website (optional)" type="url" value={form.portfolio} onChange={(value) => set("portfolio", value)} placeholder="https://" /><Field label="Instagram (optional)" type="url" value={form.instagram} onChange={(value) => set("instagram", value)} placeholder="https://" /><Field label="TikTok (optional)" type="url" value={form.tiktok} onChange={(value) => set("tiktok", value)} placeholder="https://" /><Field label="LinkedIn (optional)" type="url" value={form.linkedin} onChange={(value) => set("linkedin", value)} placeholder="https://" /></div></details>
      </section> : null}

      {step === 2 ? <section className="pi-join-stage"><header className="pi-join-stage__header"><p>STEP 3</p><h2>Almost done.</h2><span>Check the essentials, add a photo only if you want, then send.</span></header>
        <div className="pi-join-summary"><div><span>Path</span><strong>{category?.title}</strong></div>{world ? <div><span>World</span><strong>{world.title}</strong></div> : null}<div><span>Role</span><strong>{role?.title}</strong></div><div><span>Name</span><strong>{form.fullName}</strong></div><div><span>Contact</span><strong>{form.email}<small>{form.phone}</small></strong></div></div>
        <div className="pi-join-form-section pi-join-files-section"><div className="pi-join-section-heading"><div><h3>Add a photo</h3><p>Completely optional and kept private with your application.</p></div><span>OPTIONAL</span></div><div className="pi-join-photo-upload"><label><span aria-hidden="true">＋</span><strong>{photo?.name ?? "Choose a photo"}</strong><small>JPG, PNG or WebP · max 5 MB · visible only to authorized admins</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choosePhoto(event.target.files?.[0] ?? null)} /></label></div></div>
        <div className="pi-join-compensation"><span>How compensation works</span><p>{category?.compensation}</p><small>The final structure is confirmed after the interview and depends on the role.</small></div>
        <label className="pi-join-consent"><input type="checkbox" checked={form.termsAccepted} onChange={(event) => set("termsAccepted", event.target.checked)} /><span>I confirm this information is accurate and accept the <Link href="/policies/terms" target="_blank">terms</Link> and <Link href="/policies/privacy" target="_blank">privacy policy</Link>.</span></label>
      </section> : null}

      {error ? <p className="pi-join-error" role="alert">{error}</p> : null}
      <nav className="pi-join-actions" aria-label="Application steps">{step > 0 ? <Button variant="secondary" onClick={back}>Back</Button> : <span />}{step < 2 ? <Button size="large" onClick={next}>{step === 0 ? "Tell us about you" : "Review application"} <span aria-hidden="true">→</span></Button> : <Button size="large" disabled={isPending} onClick={submit}>{isPending ? "Sending…" : previewMode ? "Preview submission" : "Send application"} <span aria-hidden="true">→</span></Button>}</nav>
    </div>
  </div>;
}

function Question({ question, value, onChange }: { question: RecruitmentQuestion; value: string; onChange: (value: string) => void }) {
  if (question.type === "multiselect") {
    const selected = value ? value.split(" | ") : [];
    return <fieldset className="pi-join-question"><legend>{question.label}{question.required ? <b> *</b> : <small>Optional</small>}</legend><div className="pi-join-chips">{question.options?.map((option) => { const active = selected.includes(option); return <button type="button" key={option} className={active ? "is-selected" : ""} aria-pressed={active} onClick={() => onChange((active ? selected.filter((item) => item !== option) : [...selected, option]).join(" | "))}>{option}</button>; })}</div></fieldset>;
  }
  return <label className="pi-join-field pi-join-field--question"><span>{question.label}{question.required ? <b> *</b> : <small>Optional</small>}</span>{question.type === "select" ? <select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Choose one</option>{question.options?.map((option) => <option key={option}>{option}</option>)}</select> : question.type === "textarea" ? <textarea rows={3} maxLength={2000} value={value} onChange={(event) => onChange(event.target.value)} /> : <input type={question.type === "url" ? "url" : "text"} value={value} onChange={(event) => onChange(event.target.value)} />}</label>;
}
