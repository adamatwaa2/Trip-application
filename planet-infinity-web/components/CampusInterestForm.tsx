"use client";
import Link from "next/link";
import {useRef,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {submitInfluencerInterest} from "@/app/actions/influencer-interest";
import {submitCampusInterest} from "@/app/actions/campus-interest";
export function CampusInterestForm({kind="campus"}:{kind?:"campus"|"influencer"}){
 const influencer=kind==="influencer";
 const router=useRouter(),trackingToken=useRef<string|null>(null);
 const [sent,setSent]=useState(false),[error,setError]=useState(''),[pending,startTransition]=useTransition();
 const [universityPrefix,setUniversityPrefix]=useState(''),[requestedCode,setRequestedCode]=useState('');
 if(sent)return <div role="status" className="hw-notice"><h2>Registration received.</h2><p>Keep your private code page link. Contact Planet Infinity if you need help accessing your registration.</p></div>;
 return <form action={form=>startTransition(async()=>{setError('');trackingToken.current??=crypto.randomUUID();form.set('trackingToken',trackingToken.current);try{const result=await (influencer?submitInfluencerInterest:submitCampusInterest)(form);if(result.ok){if(result.statusPath)router.push(result.statusPath);else setSent(true);}else setError(result.error??'Please try again.');}catch{setError('Connection interrupted. Please try again.');}})}>
  <div className={influencer?undefined:"hw-field-row"}><div><label className="hw-field" htmlFor="campus-name">Full name</label><input className="hw-input" id="campus-name" name="name" autoComplete="name" required minLength={2} maxLength={120}/></div>{!influencer?<div><label className="hw-field" htmlFor="campus-university">University / group</label><input className="hw-input" id="campus-university" name="university" required minLength={2} maxLength={120}/></div>:null}</div>
  <div className="hw-field-row"><div><label className="hw-field" htmlFor="campus-email">Email</label><input className="hw-input" id="campus-email" name="email" type="email" autoComplete="email" required maxLength={254}/></div><div><label className="hw-field" htmlFor="campus-phone">Mobile / WhatsApp</label><input className="hw-input" id="campus-phone" name="phone" type="tel" autoComplete="tel" required minLength={6} maxLength={40}/></div></div>
  {!influencer?<div className="hw-field-row"><div><label className="hw-field" htmlFor="campus-prefix">University abbreviation</label><input className="hw-input" id="campus-prefix" name="universityPrefix" value={universityPrefix} onChange={e=>setUniversityPrefix(e.target.value.toUpperCase())} required minLength={2} maxLength={10} pattern="[A-Za-z]{2,10}" placeholder="AUC"/><p className="hw-smallprint">Use your university or faculty abbreviation, in English letters only, for example AUC or FOFA.</p></div><div><label className="hw-field" htmlFor="campus-code">Your preferred code</label><input className="hw-input" id="campus-code" name="requestedCode" value={requestedCode} onChange={e=>setRequestedCode(e.target.value.toUpperCase())} required minLength={3} maxLength={24} pattern={universityPrefix?`${universityPrefix}[A-Za-z0-9\\-]{1,${24-universityPrefix.length}}`:'[A-Za-z][A-Za-z0-9\\-]{2,23}'} placeholder={universityPrefix?`${universityPrefix}-D1`:'AUC-D1'}/><p className="hw-smallprint">Start with the exact abbreviation above, then add letters, numbers or a dash. Example: AUC-D1. If available, your code activates immediately after registration and appears on your private code page. No admin approval is needed.</p></div></div>:null}
  <input name="website" type="text" tabIndex={-1} hidden autoComplete="off"/>
  <label className="hw-check-row"><input name="consent" type="checkbox" required/><span>I agree to the <Link href="/policies/privacy" target="_blank">Privacy Policy</Link> and to being contacted about the {influencer?"Influencer":"Campus Ambassadors"} programme.</span></label>
  <button className="hw-button" disabled={pending} type="submit">{pending?'Creating your code…':'Create my code ↗'}</button>{error?<p className="hw-error" role="alert">{error}</p>:null}
 </form>;
}
