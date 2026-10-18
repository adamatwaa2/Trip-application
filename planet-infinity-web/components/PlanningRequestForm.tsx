"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { submitPlanningRequest } from "@/app/actions/planning-requests";
import { PLANNING_TYPES, PROM_VENUE_OPTIONS, planningServices, getRequestCategory, validatePlanning, type PlanningInput, type PlanningKind, type RequestCategory } from "@/content/planning-requests";
import { PolicyAcceptance } from "./PolicyAcceptance";

export function PlanningRequestForm({ kind, category, preview = false, onPreviewSubmit }: { kind: PlanningKind; category?: RequestCategory; preview?: boolean; onPreviewSubmit?: (input: PlanningInput) => string }) {
  const info = PLANNING_TYPES[kind];
  const chosen = getRequestCategory(category);
  const needsOrganisation = kind === "organisation" || chosen?.organisationType === "Company" || chosen?.id === "prom";
  const organisationChoices = chosen?.id === "prom" || chosen?.id === "senior" ? ["School", "University", "Other"] : ["Company", "School", "University", "Other"];
  const [values, setValues] = useState<PlanningInput>({ category, kind, fullName: "", email: "", phone: "", organisationType: chosen?.organisationType ?? "", organisationName: "", destination: "", preferredDate: "", flexible: true, guestCount: 1, budget: "", services: [], notes: "", consent: false, website: "" });
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [pending, startTransition] = useTransition();
  const change = <K extends keyof PlanningInput>(key: K, value: PlanningInput[K]) => setValues(current => ({ ...current, [key]: value }));
  if (reference) return <section className="pi-planning-card" role="status"><p className="pi-eyebrow">{preview ? "Preview only" : "Request received"}</p><h2>Thanks. Let’s plan it.</h2><p>Your reference: <strong>{reference}</strong></p><p>{preview ? "This request is visible in the preview inbox only. Nothing was sent or saved to the live database." : "Our team will contact you using the details you provided. No booking or payment has been made."}</p><button className="pi-btn" onClick={() => { setReference(""); setValues(current => ({ ...current, notes: "" })); }}>Start another request</button></section>;
  return <section className="pi-planning-card"><p className="pi-eyebrow">{chosen?.label ?? info.label}</p><h2>{chosen?.id === "prom" ? "Let’s plan your prom." : chosen?.id === "senior" ? "Your senior trip starts here." : chosen?.id === "team-building" ? "Bring your team together." : info.title}</h2><p>{chosen?.id === "prom" ? "Tell us about your school or university, your vision for the night and what you’d like us to organise." : chosen?.id === "team-building" ? "Tell us about your team and the activities or support you have in mind." : info.description}</p>
    <form className="pi-admin-form" onSubmit={event => {
      event.preventDefault();
      const input = { ...values, kind, category };
      const error = validatePlanning(input);
      if (error) { setMessage(error); return; }
      setMessage("");
      if (preview) { setReference(onPreviewSubmit?.(input) ?? "PREVIEW-ONLY"); return; }
      startTransition(async () => {
        try { const result = await submitPlanningRequest(input); if (result.ok) setReference(result.requestNumber); else setMessage(result.error); }
        catch { setMessage("Your request was not confirmed. Please try again."); }
      });
    }}>
      <div className="pi-admin-form__grid pi-admin-form__grid--two">
        <label>Full name<input required autoComplete="name" maxLength={120} value={values.fullName} onChange={e => change("fullName", e.target.value)} /></label>
        <label>Mobile / WhatsApp<input required type="tel" autoComplete="tel" maxLength={40} value={values.phone} onChange={e => change("phone", e.target.value)} /></label>
        <label>Email<input required type="email" autoComplete="email" maxLength={254} value={values.email} onChange={e => change("email", e.target.value)} /></label>
        <label>Number of guests<input required type="number" min={1} max={10000} value={values.guestCount} onChange={e => change("guestCount", Number(e.target.value))} /></label>
        {needsOrganisation ? <>{!chosen?.organisationType ? <label>Organisation type<select required value={values.organisationType} onChange={e => change("organisationType", e.target.value)}><option value="">Choose one</option>{organisationChoices.map(item => <option key={item}>{item}</option>)}</select></label> : null}<label>{values.organisationType === "Company" ? "Company name" : values.organisationType === "School" ? "School name" : values.organisationType === "University" ? "University name" : "Organisation name"}<input required maxLength={200} value={values.organisationName} onChange={e => change("organisationName", e.target.value)} /></label></> : null}
        {chosen?.id === "prom" ? <label>What kind of venue do you have in mind?<select value={values.venuePreference ?? ""} onChange={e => change("venuePreference", e.target.value)}><option value="">Not decided yet</option>{PROM_VENUE_OPTIONS.map(option => <option key={option}>{option}</option>)}</select></label> : null}
        <label>{chosen?.id === "prom" ? "Venue name, area or idea (optional)" : kind === "event" ? "Event type / preferred location" : "Destination / trip idea"}<input required={chosen?.id !== "prom"} maxLength={254} value={values.destination} onChange={e => change("destination", e.target.value)} /></label>
        <label>Preferred date (optional)<input type="date" value={values.preferredDate} onChange={e => change("preferredDate", e.target.value)} /></label>
        <label>Budget in EGP (optional)<input placeholder="e.g. per person or total — please specify" maxLength={200} value={values.budget} onChange={e => change("budget", e.target.value)} /></label>
      </div>
      <label className="pi-planning-check"><input type="checkbox" checked={values.flexible} onChange={e => change("flexible", e.target.checked)} />My dates are flexible / not decided yet</label>
      {kind === "event" ? <fieldset><legend>{chosen?.id === "prom" ? "What would you like for your prom? (optional)" : "What would you like help with? (optional)"}</legend><div className="pi-planning-services">{planningServices(category).map(service => <label key={service}><input type="checkbox" checked={values.services.includes(service)} onChange={e => change("services", e.target.checked ? [...values.services, service] : values.services.filter(item => item !== service))} />{service}</label>)}</div></fieldset> : null}
      <label>Anything else? (optional)<textarea maxLength={2000} rows={4} value={values.notes} onChange={e => change("notes", e.target.value)} /></label>
      {chosen?.id === "prom" ? <><label className="pi-planning-check"><input type="checkbox" checked={values.meetingRequested ?? false} onChange={e => change("meetingRequested", e.target.checked)} />I’d like a planning meeting to explore ideas.</label><p className="pi-admin-help">We’ll contact you to discuss concepts, venue options and a suitable meeting time. This does not book a meeting or venue automatically.</p></> : null}
      <div hidden aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={values.website} onChange={e => change("website", e.target.value)} /></label></div>
      <PolicyAcceptance id={`planning-policy-${kind}`} checked={values.consent} onChange={value => change("consent", value)} />
      <p className="pi-admin-help">We use your details to respond to this request. No marketing subscription is added.</p>
      {message ? <p role="alert" className="pi-admin-error">{message}</p> : null}
      <button disabled={pending} className="pi-btn pi-btn--primary" type="submit">{pending ? "Sending…" : preview ? "Try request — preview only" : "Send request"}</button>
      {!preview ? <Link href="/requests">Other request types</Link> : null}
    </form>
  </section>;
}
