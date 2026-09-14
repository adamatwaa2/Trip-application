"use client";

import { useState, useTransition } from "react";
import { createCareerPhotoUploadTarget, submitPublicRequest } from "@/app/actions/requests";
import { createClient } from "@/lib/supabase/client";

const ROLES = ["Content Creator", "Videographer", "Travel Consultant", "Sales", "Trip Counselor", "Experience Crew", "Operations"];
const STATUSES = ["Working", "University", "Freelance", "Between things", "Other"];
const SKILLS = ["Communication", "Leadership", "Organising", "Content creation", "Photography & video", "Social media", "Sales", "Customer service", "Trip leading", "Events", "Something else"];
const MUSIC = ["Pop / Hits", "Arabic / Shaabi", "Techno / House", "R&B / Chill", "Rock", "Anything, I'm easy"];

type FormFields = {
  fullName: string; birthDate: string; phone: string; email: string; location: string; instagram: string;
  aboutYou: string; experience: string; why: string;
};

const EMPTY_FIELDS: FormFields = { fullName: "", birthDate: "", phone: "", email: "", location: "", instagram: "", aboutYou: "", experience: "", why: "" };

function ChoiceGroup({ label, options, value, onChange, multiple = false }: { label: string; options: string[]; value: string | string[]; onChange: (value: string | string[]) => void; multiple?: boolean }) {
  const chosen = Array.isArray(value) ? value : value ? [value] : [];
  return <fieldset className="pi-careers-choice"><legend>{label}</legend><div className="chip-group">{options.map((option) => {
    const selected = chosen.includes(option);
    return <button key={option} type="button" className={`chip${selected ? " selected" : ""}`} aria-pressed={selected} onClick={() => {
      if (!multiple) return onChange(option);
      onChange(selected ? chosen.filter((item) => item !== option) : [...chosen, option]);
    }}>{option}</button>;
  })}</div></fieldset>;
}

export function CareersApplicationForm() {
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [roles, setRoles] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [music, setMusic] = useState("");
  const [hasExperience, setHasExperience] = useState("");
  const [travelFrequency, setTravelFrequency] = useState("");
  const [travelsForWork, setTravelsForWork] = useState("");
  const [overnight, setOvernight] = useState("");
  const [limitations, setLimitations] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update(key: keyof FormFields, value: string) { setFields((current) => ({ ...current, [key]: value })); }
  const canSubmit = fields.fullName.trim().length > 1 && fields.phone.trim().length > 5 && fields.email.includes("@") && fields.location.trim() && fields.aboutYou.trim() && fields.why.trim() && roles.length && currentStatus && skills.length && music && hasExperience && travelFrequency && travelsForWork && overnight && limitations && agreed;

  async function uploadPhotos() {
    return Promise.all(photos.map(async (file) => {
      const target = await createCareerPhotoUploadTarget({ mimeType: file.type, size: file.size });
      if (!target.ok) throw new Error(target.error);
      const { error: uploadError } = await createClient().storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw new Error("One of the photos could not be uploaded. Please try again.");
      return { path: target.path, fileName: file.name };
    }));
  }

  if (reference) return <div className="pi-careers-success" role="status"><span aria-hidden="true">✓</span><h2>Your story is with us.</h2><p>Thanks, {fields.fullName.split(" ")[0]}. The team will review your application and contact you if there is a match.</p><strong>Reference: {reference}</strong></div>;

  return <form className="pi-careers-form" onSubmit={(event) => {
    event.preventDefault();
    if (!canSubmit || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const careerPhotos = await uploadPhotos();
        const result = await submitPublicRequest({
          requestType: "application", externalSubjectId: "careers", subjectSlug: "careers", subjectTitle: `Careers — ${fields.fullName}`,
          fullName: fields.fullName, email: fields.email, phone: fields.phone, termsAccepted: agreed, whatsappOptIn,
          notes: `CAREER APPLICATION — ${fields.fullName}`,
          selections: { kind: "career", roles, birthDate: fields.birthDate, location: fields.location, instagram: fields.instagram, currentStatus, aboutYou: fields.aboutYou, skills, music, hasExperience, experience: fields.experience, travelFrequency, travelsForWork, overnight, limitations, why: fields.why, careerPhotos },
        });
        if (!result.ok) throw new Error(result.error);
        setReference(result.requestNumber);
      } catch (caught) { setError(caught instanceof Error ? caught.message : "The application could not be sent."); }
    });
  }}>
    <section className="pi-careers-form__section"><header><b>01</b><div><h2>The basics</h2><p>So we can actually reach you</p></div></header>
      <label>Full name<input required type="text" autoComplete="name" placeholder="e.g. Sarah Ahmed" value={fields.fullName} onChange={(e) => update("fullName", e.target.value)} /></label>
      <label>Date of birth <span className="opt">(optional)</span><span className="pi-careers-date"><input type="date" value={fields.birthDate} onChange={(e) => update("birthDate", e.target.value)} /></span></label>
      <div className="pi-careers-form__two"><label>Mobile / WhatsApp<input required type="tel" autoComplete="tel" placeholder="+20 1xxxxxxxxx" value={fields.phone} onChange={(e) => update("phone", e.target.value)} /></label><label>Email<input required type="email" autoComplete="email" placeholder="you@email.com" value={fields.email} onChange={(e) => update("email", e.target.value)} /></label></div>
      <label>Where are you based?<input required type="text" autoComplete="address-level2" placeholder="e.g. Cairo, Giza" value={fields.location} onChange={(e) => update("location", e.target.value)} /></label>
      <label>Instagram <span className="opt">(optional)</span><input type="text" placeholder="@username" value={fields.instagram} onChange={(e) => update("instagram", e.target.value)} /></label>
      <ChoiceGroup label="What are you doing right now?" options={STATUSES} value={currentStatus} onChange={(value) => setCurrentStatus(value as string)} />
    </section>

    <section className="pi-careers-form__section"><header><b>02</b><div><h2>Your place in the story</h2><p>Tell us where you would shine</p></div></header>
      <ChoiceGroup label="Which role are you applying for?" options={ROLES} value={roles} multiple onChange={(value) => setRoles(value as string[])} />
      <label>Tell us about yourself<textarea required rows={5} placeholder="Who are you when nobody is reading a CV?" value={fields.aboutYou} onChange={(e) => update("aboutYou", e.target.value)} /></label>
      <ChoiceGroup label="What are you good at? Choose all that apply." options={SKILLS} value={skills} multiple onChange={(value) => setSkills(value as string[])} />
      <ChoiceGroup label="Your music taste (this matters more than you think)" options={MUSIC} value={music} onChange={(value) => setMusic(value as string)} />
      <ChoiceGroup label="Worked in trips, events or hospitality before?" options={["Yes", "No, but I learn fast"]} value={hasExperience} onChange={(value) => setHasExperience(value as string)} />
      <label>Tell us about it <span className="opt">(optional)</span><textarea rows={4} value={fields.experience} onChange={(e) => update("experience", e.target.value)} /></label>
    </section>

    <section className="pi-careers-form__section"><header><b>03</b><div><h2>The road</h2><p>Travel is the job, so give us an honest picture</p></div></header>
      <ChoiceGroup label="How often do you travel?" options={["Rarely", "Sometimes", "Often", "Very often"]} value={travelFrequency} onChange={(value) => setTravelFrequency(value as string)} />
      <ChoiceGroup label="Comfortable travelling often for work?" options={["Yes", "No", "Depends"]} value={travelsForWork} onChange={(value) => setTravelsForWork(value as string)} />
      <ChoiceGroup label="Comfortable staying overnight on trips?" options={["Yes", "No"]} value={overnight} onChange={(value) => setOvernight(value as string)} />
      <ChoiceGroup label="Any schedule or travel limitations?" options={["Yes", "No"]} value={limitations} onChange={(value) => setLimitations(value as string)} />
    </section>

    <section className="pi-careers-form__section"><header><b>04</b><div><h2>Show us who you are</h2><p>A face for the story, not another CV</p></div></header>
      <label className="pi-careers-upload"><span>Upload one or two photos <span className="opt">(optional)</span></span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => {
        const selected = Array.from(event.currentTarget.files ?? []).slice(0, 2);
        if (selected.some((file) => file.size > 5 * 1024 * 1024)) { setError("Each photo must be 5 MB or smaller."); event.currentTarget.value = ""; return; }
        setPhotos(selected); setError(null);
      }} /><small>{photos.length ? photos.map((file) => file.name).join(" · ") : "JPG, PNG or WebP · maximum 5 MB each"}</small><em>Private — visible only to authorized Planet Infinity admins.</em></label>
    </section>

    <section className="pi-careers-form__section"><header><b>05</b><div><h2>Why us</h2><p>Be honest. We can tell.</p></div></header>
      <label>Why do you want to join Planet Infinity?<textarea required rows={6} value={fields.why} onChange={(e) => update("why", e.target.value)} /></label>
      <label className="agree-row"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>I&apos;m happy for Planet Infinity to keep my details on file and contact me about working together.</span></label>
      <label className="agree-row"><input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} /><span>You can reach me about this application on WhatsApp.</span></label>
      {error ? <p className="pi-flow__error" role="alert">{error}</p> : null}
      <button className="submit-btn" type="submit" disabled={!canSubmit || isPending}>{isPending ? "Sending your application…" : "Send my application"}</button>
      <p className="pi-careers-form__note">No CV needed. If we want to take it further, we&apos;ll ask you for the rest directly.</p>
    </section>
  </form>;
}
