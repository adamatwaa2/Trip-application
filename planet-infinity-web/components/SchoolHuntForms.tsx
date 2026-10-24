"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { submitSchoolHunt } from "@/app/actions/school-hunt";
import { schoolHuntPackages, validateHunt, type HuntInput, type HuntPath } from "@/content/school-hunt";
import { PolicyAcceptance } from "./PolicyAcceptance";
import s from "./SchoolHunt.module.css";

function Intake({ path }: { path: HuntPath }) {
  const school = path === "school";
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [pending, startTransition] = useTransition();
  const status = useRef<HTMLDivElement>(null);
  const fields = ["fullName", "email", "phone", "school", "city", "role", "count", "package", "hotel", "year", "age", "strengths", "motivation", "availability", "peerIdea", "song", "notes", "website"] as const;
  if (reference) return <div className={s.received} role="status" tabIndex={-1} ref={status}><p className={s.eyebrow}>Received</p><h3>{school ? "Your school is on our radar." : "We’re glad you raised your hand."}</h3><p>Reference <strong>{reference}</strong></p><p>{school ? "We’ll contact your school representative to discuss the group, stay preferences and next steps." : "We’ll review your application and contact you about the next step. Submitting does not guarantee selection."}</p><p>No booking, payment or automatic acceptance has been made.</p></div>;
  return <form className={s.form} onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = { ...Object.fromEntries(fields.map(key => [key, String(data.get(key) ?? "")])), path, consent, permission: data.get("permission") === "on" } as HuntInput;
    const issue = validateHunt(input); if (issue) { setError(issue); return; }
    setError("");
    startTransition(async () => { try { const result = await submitSchoolHunt(input); if (result.ok) { setReference(result.requestNumber); requestAnimationFrame(() => status.current?.focus()); } else setError(result.error); } catch { setError("We could not confirm receipt. Your answers are still here; please try again."); } });
  }}>
    <div className={s.formIntro}><p className={s.eyebrow}>{school ? "For school representatives" : "For senior students"}</p><h3>{school ? "Bring your school into the story." : "Help build it with your classmates."}</h3><p>{school ? "Tell us about your group. Choose a stay preference and we’ll talk through the possibilities together." : "A proposed founding cohort of 10–30 students from different schools. Tell us who you are and what you’d love to create."}</p></div>
    <div className={s.fields}>
      <label>Full name<input name="fullName" autoComplete="name" maxLength={120} required /></label>
      <label>Email<input name="email" autoComplete="email" type="email" maxLength={254} required /></label>
      <label>Mobile / WhatsApp<input name="phone" autoComplete="tel" type="tel" maxLength={40} required /></label>
      <label>School name<input name="school" maxLength={200} required /></label>
      <label>City<input name="city" maxLength={120} required /></label>
      {school ? <><label>Your connection to the school<select name="role" required defaultValue=""><option value="" disabled>Choose one</option><option>School administrator</option><option>Teacher / school coordinator</option><option>Parent representative</option><option>Student representative (introduction only)</option></select></label><label>Estimated students<input name="count" type="number" min={20} max={500} placeholder="e.g. 25" required /><small>Minimum 20 per school; larger delegations need a capacity review.</small></label><label>Hotel preference (optional)<input name="hotel" maxLength={200} placeholder="A hotel name, or ask us to recommend" /></label></> : <><label>School year<input name="year" placeholder="e.g. Grade 12 / Year 13" maxLength={120} required /></label><label>Age<input name="age" type="number" min={15} max={21} required /><small>Proposed intake: senior students aged 15–21; final eligibility is reviewed.</small></label><label>Weekly availability<input name="availability" maxLength={200} placeholder="e.g. 2 hours, after school" required /></label></>}
    </div>
    {school ? <fieldset className={s.packages}><legend>Your package preference</legend><p>Proposed stay tiers for discussion. Hotels, inclusions, rates and availability are still being confirmed.</p><div>{schoolHuntPackages.map(p => <label key={p.id}><input name="package" type="radio" value={p.id} required /><span><strong>{p.title}</strong><small>{p.description}</small></span></label>)}</div></fieldset> : <><label>Your strengths<textarea name="strengths" rows={2} maxLength={1200} placeholder="Communication, organising, content, creative ideas…" required /></label><label>Why do you want to join?<textarea name="motivation" rows={2} maxLength={1200} required /></label><label>What would you create with your classmates?<textarea name="peerIdea" rows={3} maxLength={1200} placeholder="A challenge category, a social moment, a creative workshop…" required /><small>Collect ideas with your peers. Each participating school has a voice on approved categories; game secrets stay with independent Game Control.</small></label><label>One song that feels like you (optional)<input name="song" maxLength={300} placeholder="Song title + artist" /><small>A conversation starter. Music taste does not decide selection.</small></label><label className={s.check}><input type="checkbox" name="permission" required /><span>I understand that required guardian and school permissions, role terms and incentives must be agreed before joining. I will not collect money or make commitments on behalf of Planet Infinity.</span></label></>}
    <label>{school ? "What matters most for your school? (optional)" : "Anything else? (optional)"}<textarea name="notes" rows={3} maxLength={2000} /></label>
    <div hidden aria-hidden="true"><label>Website<input name="website" autoComplete="off" tabIndex={-1} /></label></div>
    <PolicyAcceptance id={`hunt-${path}-policies`} scope="application" checked={consent} onChange={setConsent} />
    <p className={s.fine}>We use your details to review and respond to this request. No marketing subscription is added. Please do not send IDs, medical details or student lists. {school ? "Submitting an interest form does not commit your school to a booking." : "Applying does not guarantee employment or acceptance."}</p>
    {error ? <p role="alert" className={s.error}>{error}</p> : null}
    <button type="submit" className="pi-btn pi-btn--primary" disabled={pending}>{pending ? "Sending…" : school ? "Send school interest" : "Submit crew application"}</button>
  </form>;
}
export function SchoolHuntForms() {
  const [path, setPath] = useState<HuntPath>("school");
  useEffect(() => { const sync = () => { if (window.location.hash === "#join-crew") setPath("crew"); else if (window.location.hash === "#take-part") setPath("school"); }; sync(); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync); }, []);
  return <section id="take-part" className={s.apply}><span id="join-crew" style={{scrollMarginTop: 110}} /><div className={s.wrap}><header className={s.sectionHead}><p className={s.eyebrow}>Your way in</p><h2>Two ways to take part.</h2><p>Represent your school, or help create the experience with your peers.</p></header><div className={s.tabs} role="tablist" aria-label="Application path">{(["school", "crew"] as const).map(p => <button key={p} type="button" role="tab" id={`tab-${p}`} aria-controls={`panel-${p}`} aria-selected={path === p} tabIndex={path === p ? 0 : -1} onClick={() => setPath(p)} onKeyDown={e => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) { e.preventDefault(); const next = e.key === "Home" ? "school" : e.key === "End" ? "crew" : path === "school" ? "crew" : "school"; setPath(next); document.getElementById(`tab-${next}`)?.focus(); } }}>{p === "school" ? "Apply as a school" : "Join the youth crew"}</button>)}</div>{(["school", "crew"] as const).map(p => <div role="tabpanel" key={p} id={`panel-${p}`} aria-labelledby={`tab-${p}`} hidden={path !== p}><Intake path={p} /></div>)}</div></section>;
}
