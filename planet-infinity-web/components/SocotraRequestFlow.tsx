"use client";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "./Button";
import { PolicyAcceptance } from "./PolicyAcceptance";
import { TripSelection, type SelectionState } from "./TripSelection";
import { SOCOTRA_ACTIVE_RATE, SOCOTRA_CONNECTION, SOCOTRA_DEPARTURES, SOCOTRA_RATE, normalizeSocotraPhone, socotraEstimate } from "@/content/socotra";
import { submitSocotraRequest } from "@/app/actions/socotra";
const STEPS=["Your choices","Trip questions","Your details","Review"];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
type Guest={name:string;phone:string;nationality:string;passportCountry:string;passportExpiry:string};
const newGuest=():Guest=>({name:"",phone:"",nationality:"",passportCountry:"",passportExpiry:""});
function PassportDate({id,value,onChange}:{id:string;value:string;onChange:(value:string)=>void}) {
 const [year,month,day]=value.split('-');
 const setPart=(part:string,next:string)=>onChange(`${part==='year'?next:year||''}-${part==='month'?next:month||''}-${part==='day'?next:day||''}`);
 return <div className="socotra-date"><div><label htmlFor={`${id}-day`}>Day</label><select id={`${id}-day`} required value={day||''} onChange={e=>setPart('day',e.target.value)}><option value="">DD</option>{Array.from({length:31},(_,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{i+1}</option>)}</select></div><div><label htmlFor={`${id}-month`}>Month</label><select id={`${id}-month`} required value={month||''} onChange={e=>setPart('month',e.target.value)}><option value="">Month</option>{MONTHS.map((m,i)=><option key={m} value={String(i+1).padStart(2,'0')}>{m}</option>)}</select></div><div><label htmlFor={`${id}-year`}>Year</label><select id={`${id}-year`} required value={year||''} onChange={e=>setPart('year',e.target.value)}><option value="">YYYY</option>{Array.from({length:30},(_,i)=><option key={i} value={String(2026+i)}>{2026+i}</option>)}</select></div></div>;
}
function validPassport(expiry:string,departure:string) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(expiry)||expiry<=departure) return false;
 const date=new Date(`${expiry}T00:00:00Z`);
 return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===expiry;
}
export function SocotraRequestFlow() {
 const [step,setStep]=useState(0);
 const [selection,setSelection]=useState<SelectionState>({});
 const [count,setCount]=useState('');
 const [city,setCity]=useState('');
 const [country,setCountry]=useState('');
 const [email,setEmail]=useState('');
 const [guests,setGuests]=useState<Guest[]>([]);
 const [policyAgreed,setPolicyAgreed]=useState(false);
 const [requestAgreed,setRequestAgreed]=useState(false);
 const [checked,setChecked]=useState(false);
 const [requestNumber,setRequestNumber]=useState('');
 const [submitError,setSubmitError]=useState('');
 const [isPending,startTransition]=useTransition();
 const [phoneTouched,setPhoneTouched]=useState<Record<number,boolean>>({});
 const heading=useRef<HTMLHeadingElement>(null);
 const rate=SOCOTRA_RATE[SOCOTRA_ACTIVE_RATE];
 const estimate=socotraEstimate(count);
 const validCount=Number.isInteger(Number(count))&&Number(count)>=1&&Number(count)<=80;
 const departure=SOCOTRA_DEPARTURES.choices.find(c=>c.id===selection.departure);
 const choose=(id:string,value:string)=>setSelection(previous=>({...previous,[id]:value}));
 useEffect(()=>{if(step>0)heading.current?.focus();window.scrollTo({top:0,behavior:'smooth'});},[step]);
 function changeCount(value:string){setCount(value);const n=Number(value);setGuests(previous=>Number.isInteger(n)&&n>=1&&n<=80?Array.from({length:n},(_,i)=>previous[i]??newGuest()):[]);}
 function guestChange(index:number,key:keyof Guest,value:string){setGuests(previous=>previous.map((guest,i)=>i===index?{...guest,[key]:value}:guest));}
 const canContinue=step===0?Boolean(selection.departure):step===1?validCount&&Boolean(selection.connection&&city.trim()&&country.trim()):step===2?Boolean(email.trim()&&guests.length===Number(count)&&guests.every(g=>g.name.trim().length>=2&&normalizeSocotraPhone(g.phone)&&g.nationality.trim()&&g.passportCountry.trim()&&validPassport(g.passportExpiry,selection.departure))):policyAgreed&&requestAgreed;
 function next(event:FormEvent){
  event.preventDefault();if(!canContinue||isPending)return;
  if(step<3){setStep(value=>value+1);return;}
  setSubmitError('');
  startTransition(async()=>{
   try{
    const result=await submitSocotraRequest({departure:selection.departure,count:Number(count),city,country,email,guests,connection:selection.connection,policyAccepted:policyAgreed,requestAccepted:requestAgreed});
    if(!result.ok){setSubmitError(result.error);return;}
    setRequestNumber(result.requestNumber);setChecked(true);
   }catch{setSubmitError('We could not send your request. Please try again or contact Planet Infinity.');}
  });
 }
 // No passport or contact details are included in this optional draft message.
 const whatsapp=`https://wa.me/201037299464?text=${encodeURIComponent(`Hi Planet Infinity! I'd like help arranging flights to Jeddah for the Socotra trip. Preferred dates: ${departure?.label||'to be decided'}. Departure: ${city.trim()||'to be decided'}, ${country.trim()||'to be decided'}. Travelers: ${validCount?count:'to be decided'}. Please send flight options and a separate quote.`)}`;
 if(checked)return <div className="pi-flow"><div className="pi-flow__panel" role="status"><h2 className="pi-flow__title">Your request is with us</h2><p>Request reference: <strong>{requestNumber}</strong></p><p>Our team will review availability, flights, visa eligibility and your package estimate, then contact you with the next steps.</p><p>No booking is confirmed, no seats are held and no payment has been collected.</p><Link href="/trips/socotra" className="pi-btn pi-btn--secondary">Back to Socotra</Link></div></div>;
 return <form className="pi-flow" onSubmit={next}>
 <ol className="pi-flow__steps">{STEPS.map((label,i)=><li key={label} className={`pi-flow__step${i===step?' pi-flow__step--current':''}${i<step?' pi-flow__step--done':''}`} aria-current={i===step?'step':undefined}><span className="pi-flow__step-num">{i+1}</span>{label}</li>)}</ol>
 <div className="pi-flow__panel"><h2 ref={heading} tabIndex={-1} className="pi-flow__title">{STEPS[step]}</h2>
 {step===0?<><p className="pi-flow__hint">Choose when you would like to travel. We meet in Jeddah, Saudi Arabia, then fly together to Socotra. The package includes the flight to the island and back to Jeddah.</p><TripSelection groups={[SOCOTRA_DEPARTURES]} value={selection} onChange={choose}/></>:null}
 {step===1?<>
 <label className="pi-group-size" htmlFor="socotra-count"><span><strong>Your group size</strong><small>How many travelers are joining you?</small></span><input id="socotra-count" aria-label="Number of travelers" type="number" min="1" max="80" step="1" required value={count} onChange={e=>changeCount(e.target.value)}/></label>
 <section className="socotra-route-card" aria-labelledby="socotra-origin-heading"><span className="socotra-micro">Your journey starts here</span><h3 id="socotra-origin-heading">Where are you flying from?</h3><p>Tell us your starting point so we can help plan your connection to the group.</p><div className="socotra-field-grid"><div className="socotra-field"><label htmlFor="socotra-country">Country</label><input id="socotra-country" autoComplete="country-name" required maxLength={80} value={country} onChange={e=>setCountry(e.target.value)} placeholder="Your country"/></div><div className="socotra-field"><label htmlFor="socotra-city">City or airport</label><input id="socotra-city" autoComplete="address-level2" required maxLength={120} value={city} onChange={e=>setCity(e.target.value)} placeholder="Your nearest departure airport"/></div></div></section>
 <TripSelection groups={[SOCOTRA_CONNECTION]} value={selection} onChange={choose}/>
 {selection.connection==='help'?<section className="socotra-help" aria-labelledby="socotra-help-heading"><span className="socotra-micro">Let us help you get there</span><h3 id="socotra-help-heading">Plan your connection with our team</h3><p>We will look at flight options from your departure airport to Jeddah. This connection is quoted separately from the Socotra package.</p><a href={whatsapp} target="_blank" rel="noreferrer" className="pi-btn pi-btn--secondary">Ask about flights on WhatsApp ↗</a><small>Opens a draft message to Planet Infinity. You choose whether to send it. You can also continue your request here.</small></section>:null}
 {estimate!==undefined?<div className="pi-socotra-estimate" aria-live="polite"><span className="socotra-micro">{rate.label} · package estimate</span><strong>${estimate.toLocaleString('en-US')} <small>USD</small></strong><span>{count} traveler(s) × ${rate.amount.toLocaleString('en-US')} per person</span><small>Includes the island program, Socotra visa subject to approval, and flights from the meeting point in Jeddah to Socotra and back. Your travel to Jeddah is separate.</small></div>:null}
 </>:null}
 {step===2?<>
 <div className="socotra-field"><label htmlFor="socotra-email">Contact email</label><input id="socotra-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/><small>We will send the trip details and next steps here.</small></div>
 <section className="pi-guest-roster" aria-labelledby="socotra-guests"><div className="pi-guest-roster__head"><div><h3 id="socotra-guests">Who is coming?</h3><p>Use names and details exactly as shown on each passport.</p></div><span>{count} traveler(s)</span></div><div className="pi-guest-roster__list">
 {guests.map((guest,index)=><fieldset className="pi-guest-card" key={index}><legend>{index===0?'Primary traveler':`Traveler ${index+1}`}</legend>
 <div className="socotra-field"><label htmlFor={`socotra-name-${index}`}>Full name</label><input id={`socotra-name-${index}`} required maxLength={120} value={guest.name} onChange={e=>guestChange(index,'name',e.target.value)}/></div>
 <div className="socotra-field"><label htmlFor={`socotra-phone-${index}`}>Mobile / WhatsApp</label><input id={`socotra-phone-${index}`} type="tel" autoComplete="tel" required maxLength={30} placeholder="+ country code and mobile number" value={guest.phone} onChange={e=>guestChange(index,'phone',e.target.value)} onBlur={()=>setPhoneTouched(previous=>({...previous,[index]:true}))} aria-invalid={phoneTouched[index]&&!normalizeSocotraPhone(guest.phone)||undefined} aria-describedby={`socotra-phone-hint-${index}`}/><small id={`socotra-phone-hint-${index}`}>{phoneTouched[index]&&!normalizeSocotraPhone(guest.phone)?'Enter a full international number: +, country code, then your mobile number.':'Include your country code, for example +20 followed by your mobile number.'}</small></div>
 <div className="socotra-field-grid">{([['nationality','Nationality'],['passportCountry','Passport issuing country']] as const).map(([key,label])=><div className="socotra-field" key={key}><label htmlFor={`socotra-${key}-${index}`}>{label}</label><input id={`socotra-${key}-${index}`} required maxLength={80} value={guest[key]} onChange={e=>guestChange(index,key,e.target.value)}/></div>)}</div>
 <section className="socotra-passport"><h4>Passport expiry date</h4><p>Choose the date printed on your passport.</p><PassportDate id={`socotra-passport-${index}`} value={guest.passportExpiry} onChange={value=>guestChange(index,'passportExpiry',value)}/>{guest.passportExpiry.split('-').every(Boolean)&&!validPassport(guest.passportExpiry,selection.departure)?<small className="field-error">Choose a valid date after the proposed trip departure.</small>:null}</section>
 </fieldset>)}
 </div></section><p className="pi-flow__hint">No passport scan or full passport number is needed at this stage. Our team will check the required passport validity and visa eligibility.</p>
 </>:null}
 {step===3?<>
 <section className="socotra-review-hero"><span className="socotra-micro">Your island journey</span><h3>Socotra · 8 days, 7 nights</h3><p>{departure?.label}</p><span className="socotra-review-tag">Proposed dates · awaiting confirmation</span></section>
 <dl className="pi-review socotra-review-grid">{[["Package price",`${rate.label} · $${rate.amount.toLocaleString('en-US')} per person`],["Travelers",count],["Flying from",`${city}, ${country}`],["Connection to Jeddah",selection.connection==='help'?'Help requested · separate quote':'You will arrange your own flight'],["Contact email",email]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
 <div className="socotra-review-travelers">{guests.map((guest,i)=><div key={i}><span className="socotra-micro">Traveler {i+1}</span><strong>{guest.name}</strong><span>{guest.nationality} · {normalizeSocotraPhone(guest.phone)}</span><small>Passport: {guest.passportCountry} · Expires {guest.passportExpiry.split('-').reverse().join('/')}</small></div>)}</div>
 <div className="pi-socotra-estimate"><span className="socotra-micro">Estimated package total</span><strong>${estimate?.toLocaleString('en-US')} <small>USD</small></strong><small>For {count} traveler(s). Travel to Jeddah is quoted separately. Final availability, flights, rate and visa eligibility require team confirmation.</small></div>
 {selection.connection==='help'?<p><a className="socotra-review-assistance" href={whatsapp} target="_blank" rel="noreferrer">Discuss your connection with us on WhatsApp ↗</a></p>:null}
 <section className="socotra-policies"><h3>Before you send your request</h3><PolicyAcceptance checked={policyAgreed} onChange={setPolicyAgreed} id="socotra-policyAcceptance"/><label className="agree-row"><input type="checkbox" checked={requestAgreed} required onChange={e=>setRequestAgreed(e.target.checked)}/><span>I understand that this is a request for review. It does not confirm a booking or hold seats, and no payment is collected.</span></label></section>
 <p className="pi-flow__hint">We will review your request and contact you. Please wait for written confirmation before arranging your connecting travel.</p>
 </>:null}
 </div>
 <div className="pi-flow__actions">{step>0?<Button variant="secondary" disabled={isPending} onClick={()=>setStep(value=>value-1)}>← Back</Button>:<Link href="/trips/socotra" className="pi-btn pi-btn--secondary">← Back to trip</Link>}<Button type="submit" disabled={!canContinue||isPending}>{isPending?'Sending…':step<3?'Continue →':'Request Booking'}</Button></div>
 {submitError?<p className="pi-flow__error" role="alert">{submitError}</p>:null}
 </form>;
}
