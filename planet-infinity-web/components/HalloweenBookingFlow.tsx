"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { PlanetEvent } from "@/content/events";
import { attachEventReceipt, reserveEventQuote, submitPublicEventBooking } from "@/app/actions/event-bookings";
import { nextDiscount, previewQuote, type EventQuote } from "@/lib/campus-pricing";
import { PaymentProofStep, type PaymentProofValue } from "./PaymentProofStep";
import { PaymobPixelCheckout } from "./PaymobPixelCheckout";
import { EventTicketStatus } from "./EventTicketStatus";
import { HalloweenTicket } from "./HalloweenEventPage";
import { halloweenClassName, halloweenHref, type HalloweenAppearance } from "@/lib/halloween-appearance";
import { SITE_COPY_DEFAULTS } from "@/content/site-copy";

type Guest = {name:string;phone:string};
const emptyGuest:Guest={name:"",phone:""};
const money=(n:number)=>n.toLocaleString("en-US",{maximumFractionDigits:2});

export function HalloweenBookingFlow({event,preview,appearance="paper",whatsapp=SITE_COPY_DEFAULTS.contact_whatsapp}:{event:PlanetEvent;preview:boolean;appearance?:HalloweenAppearance;whatsapp?:string}){
 const router=useRouter();
 const [step,setStep]=useState(0),[quantityInput,setQuantityInput]=useState("1"),[promoInput,setPromoInput]=useState(""),[appliedCode,setAppliedCode]=useState("");
 const [quote,setQuote]=useState<EventQuote|null>(null),[pricingError,setPricingError]=useState("");
 const [pricingVersion,setPricingVersion]=useState(0);
 const [guests,setGuests]=useState<Record<number,Guest>>({0:{...emptyGuest}}),[guestPage,setGuestPage]=useState(0);
 const [email,setEmail]=useState(""),[agreed,setAgreed]=useState(false),[method,setMethod]=useState<"manual"|"paymob">("manual");
 const [proof,setProof]=useState<PaymentProofValue|null>(null),[reservation,setReservation]=useState<{number:string;token?:string}|null>(null);
 const [completed,setCompleted]=useState(false),[error,setError]=useState(""),[pending,startTransition]=useTransition();
 const sessionId=useRef<string|null>(null),submissionId=useRef<string|null>(null);
 const quantity=Number(quantityInput),max=Math.min(event.capacity??500,500);
 const quantityValid=Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=max;
 const currentQuote=quote?.quantity===quantity&&(quote.code??"")===appliedCode?quote:null;
 const activeGuests=Array.from({length:quantityValid?quantity:0},(_,i)=>guests[i]??emptyGuest);
 const valid=Boolean(currentQuote)&&quantityValid&&activeGuests.every(g=>g.name.trim().length>=2&&g.phone.trim().length>=6)&&agreed&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
 const upcoming=currentQuote?.code?nextDiscount(currentQuote.discountTiers,quantity):undefined;
 useEffect(()=>{
  if(!quantityValid||reservation)return;
  let active=true;
  const timer=setTimeout(async()=>{
   sessionId.current??=crypto.randomUUID();
   try{
    if(preview){
     if(appliedCode&&!['FOFA-D1','AUC-D1'].includes(appliedCode)){if(active){setQuote(null);setPricingError("Demo codes: FOFA-D1 or AUC-D1.");}return;}
     if(active){setQuote(previewQuote(quantity,appliedCode,event.priceEgp??1000,event.bookingFeeEgp??0));setPricingError("");}return;
    }
    const result=await reserveEventQuote(event.id,sessionId.current,quantity,appliedCode);
    if(active){if(result.ok){setQuote(result.quote);setPricingError("");}else{setQuote(null);setPricingError(result.error);}}
   }catch{if(active){setQuote(null);setPricingError("Could not update your total. Please try again.");}}
  },400);
  return()=>{active=false;clearTimeout(timer);};
 },[quantity,quantityValid,appliedCode,event.id,event.priceEgp,event.bookingFeeEgp,preview,reservation,pricingVersion]);
 function applyCode(){setPricingError("");setQuote(null);setAppliedCode(promoInput.trim().toUpperCase());setPricingVersion(v=>v+1);}
 function updateGuest(i:number,patch:Partial<Guest>){setGuests(current=>({...current,[i]:{...(current[i]??emptyGuest),...patch}}));}
 function resize(value:string){setQuantityInput(value);setGuestPage(0);}
 function continueToPayment(){
  if(!valid||!currentQuote)return;setError("");
  if(preview){setReservation({number:"PREVIEW-"+crypto.randomUUID().slice(0,8).toUpperCase()});setStep(1);return;}
  submissionId.current??=crypto.randomUUID();
  startTransition(async()=>{try{
   const result=await submitPublicEventBooking({eventId:event.id,submissionId:submissionId.current!,sessionId:sessionId.current!,quoteId:currentQuote.id,email,guests:activeGuests,termsAccepted:agreed,paymentMethod:"paymob",paymentProof:null});
   if(!result.ok){setError(result.error);return;}
   setReservation({number:result.bookingNumber,token:result.paymentToken});setStep(1);
  }catch{setError("Connection interrupted. Retry to recover your booking safely.");}});
 }
 function finish(){
  if(!reservation||!currentQuote)return;setError("");
  if(preview){
   try{const saved=JSON.parse(localStorage.getItem("pi-halloween-preview-v1")??"[]");localStorage.setItem("pi-halloween-preview-v1",JSON.stringify([...(Array.isArray(saved)?saved:[]),{reference:reservation.number,name:guests[0].name,guestCount:quantity,code:currentQuote.code,discount:currentQuote.discountEgp,total:currentQuote.total,method,status:"Preview · not paid",createdAt:new Date().toISOString()}]));}catch{}
   setCompleted(true);return;
  }
  if(method==="paymob"){setCompleted(true);return;}
  if(!proof||!reservation.token){setError("Upload your payment receipt first.");return;}
  startTransition(async()=>{try{
   const result=await attachEventReceipt(reservation.token!,proof);
   if(!result.ok){setError(result.error);return;}router.push(`/pay/${reservation.token}`);
  }catch{setError("Receipt submission was interrupted. Please retry.");}});
 }
 if(preview&&completed&&reservation&&currentQuote)return <EventTicketStatus token="demo" preview previewMethod={method} initial={{reference:reservation.number,title:event.title,name:guests[0].name,guests:activeGuests.map(g=>g.name),quantity,date:"2026-10-30T19:00:00+02:00",endDate:"2026-10-31T02:00:00+02:00",venue:event.venue??"Cairo",ticketLabel:event.ticketLabel??"Early Bird",subtotal:currentQuote.originalSubtotal-currentQuote.discountEgp,fees:currentQuote.fees,total:currentQuote.total,paid:0,status:method==="manual"?"pending":"unpaid",issuedAt:null}}/>;
 const pages=quantityValid?Math.ceil(quantity/5):0;
 const indexes=Array.from({length:quantityValid?Math.min(5,quantity-guestPage*5):0},(_,i)=>guestPage*5+i);
 return <div className={halloweenClassName(appearance)}>
  {preview?<nav className="hw-preview-bar" aria-label="Demonstration"><strong>Campus checkout preview</strong><span>Try FOFA-D1 or AUC-D1 · no real payment or ticket</span><Link href="/preview/campus/admin">Admin preview ↗</Link></nav>:null}
  <div className="hw-wrap"><div className="hw-topline"><Link href={halloweenHref(appearance)}>← Back to the night</Link><span>Halloween / 30.10.26</span></div>
  <section className="hw-checkout"><p className="hw-eyebrow">Your world starts here</p><h1>Make it a night.</h1>
  <div className="hw-checkout-grid"><div className="hw-form">
  {completed&&reservation?<><h2>Complete your payment.</h2><p className="hw-notice">Reference: <strong>{reservation.number}</strong></p>{reservation.token?<><PaymobPixelCheckout paymentToken={reservation.token} returnPath={`/pay/${reservation.token}`}/><Link href={`/pay/${reservation.token}`}>View booking and ticket status ↗</Link></>:null}</>:<>
   <ol className="hw-progress" aria-label="Booking progress">{["Tickets & details","Payment"].map((label,i)=><li key={label} aria-current={step===i?"step":undefined}>0{i+1} / {label}</li>)}</ol>
   {step===0?<>
    <h2>Your tickets. Your people.</h2><p>Choose how many are coming. Your total updates as you go.</p>
    <label className="hw-field" htmlFor="hw-quantity">Number of tickets</label>
    <div className="hw-quantity-picker"><div className="hw-quantity-control"><button type="button" aria-label="Remove one ticket" disabled={!quantityValid||quantity<=1} onClick={()=>resize(String(quantity-1))}>−</button><input id="hw-quantity" type="number" min={1} max={max} step={1} value={quantityInput} onChange={e=>resize(e.target.value)}/><button type="button" aria-label="Add one ticket" disabled={quantity>=max} onClick={()=>resize(String(quantityValid?quantity+1:1))}>+</button></div><div className="hw-quantity-total" aria-live="polite"><span>Total including booking fees</span><strong>{currentQuote?money(currentQuote.total)+" EGP":"Updating total…"}</strong></div></div>
    <label className="hw-field" htmlFor="hw-promo">Promo code (optional)</label>
    <div className="hw-field-row"><input className="hw-input" id="hw-promo" autoCapitalize="characters" maxLength={24} placeholder="Enter your code" value={promoInput} onChange={e=>setPromoInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();applyCode();}}}/><button type="button" className="hw-button hw-button--light" onClick={applyCode}>Apply</button></div>
    {currentQuote?.code?<div className="hw-notice" role="status"><strong>{currentQuote.code} applied · {currentQuote.discountPercent}% off tickets</strong><p>You save {money(currentQuote.discountEgp)} EGP.</p>{upcoming?<p>Bring {upcoming.from-quantity} more {upcoming.from-quantity===1?"friend":"friends"} in this booking to unlock {upcoming.percent}% off all tickets.</p>:<p>You have unlocked the highest group discount.</p>}<details><summary>Group discounts with your code</summary><ul>{currentQuote.discountTiers.map((t,i)=><li key={t.from}>{t.from}{currentQuote.discountTiers[i+1]?`–${currentQuote.discountTiers[i+1].from-1}`:"+"} tickets: {t.percent}% off</li>)}</ul></details></div>:null}
    {pricingError?<p className="hw-error" role="alert">{pricingError}</p>:null}
    <label className="hw-field" htmlFor="hw-email">Booking email</label><input className="hw-input" id="hw-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/>
    {indexes.map(i=>{const g=guests[i]??emptyGuest;return <fieldset key={i}><legend>Guest {i+1}{i===0?" / booking contact":""}</legend><div className="hw-field-row"><div><label className="hw-field" htmlFor={`name-${i}`}>Full name</label><input className="hw-input" id={`name-${i}`} maxLength={120} value={g.name} onChange={e=>updateGuest(i,{name:e.target.value})}/></div><div><label className="hw-field" htmlFor={`phone-${i}`}>Mobile number</label><input className="hw-input" id={`phone-${i}`} type="tel" maxLength={40} value={g.phone} onChange={e=>updateGuest(i,{phone:e.target.value})}/></div></div></fieldset>;})}
    {pages>1?<nav className="hw-guest-pagination" aria-label="Guest details pages"><button type="button" disabled={guestPage===0} onClick={()=>setGuestPage(p=>p-1)}>← Previous guests</button><span>Guests {guestPage*5+1}–{Math.min(quantity,(guestPage+1)*5)} of {quantity}</span><button type="button" disabled={guestPage+1>=pages} onClick={()=>setGuestPage(p=>p+1)}>Next guests →</button></nav>:null}
    {currentQuote?.universityAdmission?<p className="hw-notice">University code admission: men and women 18+. Mixed groups must be 50:50, couples or girls-only. Bring your original physical ID.</p>:<details className="hw-faq"><summary>Admission requirements</summary><ul>{event.importantInformation?.map(t=><li key={t}>{t}</li>)}</ul></details>}
    <label className="hw-check-row"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span>I accept the <Link href="/policies/events-payment" target="_blank">event payment policy</Link>, admission requirements and <Link href="/policies/privacy" target="_blank">Privacy Policy</Link>. All guests meet the requirements.</span></label>
    <button type="button" className="hw-button" disabled={!valid||pending} onClick={continueToPayment}>{pending?"Reserving your tickets…":"Continue to payment →"}</button>
   </>:<>
    <h2>One final step.</h2><p>Your ticket price is saved for booking <strong>{reservation?.number}</strong>. Pay the exact total below.</p>
    {currentQuote?<dl className="hw-review">{currentQuote.lines.map(line=><div key={line.price}><dt>{line.quantity} × {money(line.price)} EGP</dt><dd>{money(line.quantity*line.price)} EGP</dd></div>)}<div><dt>Original ticket subtotal</dt><dd>{money(currentQuote.originalSubtotal)} EGP</dd></div>{currentQuote.code?<div><dt>{currentQuote.code} · {currentQuote.discountPercent}% discount</dt><dd>−{money(currentQuote.discountEgp)} EGP</dd></div>:null}<div><dt>Booking fees</dt><dd>{money(currentQuote.fees)} EGP</dd></div><div><dt>Total due now</dt><dd>{money(currentQuote.total)} EGP</dd></div></dl>:null}
    {preview?<p className="hw-notice">Demonstration only. No payment will be charged or valid ticket issued.</p>:null}
    <label className="hw-choice"><input type="radio" name="event-payment" checked={method==="manual"} onChange={()=>setMethod("manual")}/><span><strong>InstaPay / Vodafone Cash</strong><small>Transfer in full and upload your receipt.</small></span></label><label className="hw-choice"><input type="radio" name="event-payment" checked={method==="paymob"} onChange={()=>setMethod("paymob")}/><span><strong>Pay online with Visa</strong><small>Visa · Mastercard · Secure card checkout</small></span></label>
    {method==="manual"&&currentQuote?(preview?<p className="hw-notice">Demo receipt only. No transfer or upload is required. Continue below to preview ticket status.</p>:<PaymentProofStep tripId={event.id} productType="event" totalEgp={currentQuote.total} value={proof} onChange={setProof}/>):null}
    <p className="hw-smallprint">Door selection applies. Exact location sent one day before the event.</p>
    <button type="button" className="hw-button" disabled={pending||(method==="manual"&&!proof&&!preview)} onClick={finish}>{pending?"Saving…":preview?"Continue demo booking ↗":method==="paymob"?"Continue to Visa ↗":"Submit receipt for verification ↗"}</button>
    {reservation?.token?<p><Link className="hw-text-link" href={`/pay/${reservation.token}`}>Keep your private booking link ↗</Link></p>:null}
   </>}{error?<p role="alert" className="hw-error">{error}{!reservation?<button type="button" className="hw-text-link" onClick={()=>{setQuote(null);setPricingVersion(v=>v+1);setError("");}}>Refresh ticket total</button>:null}</p>:null}
  </>}
  <div className="hw-help"><p>Need help booking?</p><a className="hw-text-link" href={`https://wa.me/${whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent("Hi Planet Infinity! I need help booking the Halloween party.")}`} target="_blank" rel="noreferrer">Chat on WhatsApp ↗</a></div>
  </div><HalloweenTicket event={event} appearance={appearance}><div className="hw-smallprint" aria-live="polite">{currentQuote?<dl className="hw-review">{currentQuote.lines.map(line=><div key={line.price}><dt>{line.quantity} × {money(line.price)} EGP</dt><dd>{money(line.quantity*line.price)} EGP</dd></div>)}{currentQuote.discountPercent?<div><dt>{currentQuote.discountPercent}% ticket discount</dt><dd>−{money(currentQuote.discountEgp)} EGP</dd></div>:null}<div><dt>Booking fees</dt><dd>{money(currentQuote.fees)} EGP</dd></div><div><dt>Total · {quantity} tickets</dt><dd>{money(currentQuote.total)} EGP</dd></div></dl>:"Updating total…"}<p>Early Bird tickets are limited. Prices rise as tickets sell.</p></div></HalloweenTicket></div></section></div>
 </div>;
}
