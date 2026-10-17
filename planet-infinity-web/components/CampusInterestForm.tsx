"use client";
import Link from "next/link";
import {useState,useTransition} from "react";
import {submitCampusInterest} from "@/app/actions/campus-interest";
export function CampusInterestForm(){
 const [sent,setSent]=useState(false),[error,setError]=useState(''),[pending,startTransition]=useTransition();
 if(sent)return <div role="status" className="hw-notice"><h2>Thanks for your interest.</h2><p>Your details have been received. Planet Infinity will contact you about the programme. If approved, you will receive your own code and a ready-to-share message for your group.</p><p>No ambassador code is activated by submitting this form.</p></div>;
 return <form action={form=>startTransition(async()=>{setError('');try{const result=await submitCampusInterest(form);if(result.ok)setSent(true);else setError(result.error??'Please try again.');}catch{setError('Connection interrupted. Please try again.');}})}>
  <div className="hw-field-row"><div><label className="hw-field" htmlFor="campus-name">Full name</label><input className="hw-input" id="campus-name" name="name" autoComplete="name" required minLength={2} maxLength={120}/></div><div><label className="hw-field" htmlFor="campus-university">University / group</label><input className="hw-input" id="campus-university" name="university" required minLength={2} maxLength={120}/></div></div>
  <div className="hw-field-row"><div><label className="hw-field" htmlFor="campus-email">Email</label><input className="hw-input" id="campus-email" name="email" type="email" autoComplete="email" required maxLength={254}/></div><div><label className="hw-field" htmlFor="campus-phone">Mobile / WhatsApp</label><input className="hw-input" id="campus-phone" name="phone" type="tel" autoComplete="tel" required minLength={6} maxLength={40}/></div></div>
  <input name="website" type="text" tabIndex={-1} hidden autoComplete="off"/>
  <label className="hw-check-row"><input name="consent" type="checkbox" required/><span>I agree to the <Link href="/policies/privacy" target="_blank">Privacy Policy</Link> and to being contacted about the Campus Ambassadors programme.</span></label>
  <button className="hw-button" disabled={pending} type="submit">{pending?'Sending…':'Register your interest ↗'}</button>{error?<p className="hw-error" role="alert">{error}</p>:null}
 </form>;
}
