"use client";

import Link from "next/link";
import { EventTicketStatus } from "./EventTicketStatus";
import { SITE_COPY_DEFAULTS } from "@/content/site-copy";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { PlanetEvent } from "@/content/events";
import { submitPublicEventBooking } from "@/app/actions/event-bookings";
import { PaymentProofStep, type PaymentProofValue } from "./PaymentProofStep";
import { PaymobPixelCheckout } from "./PaymobPixelCheckout";
import { HalloweenPreviewBar, HalloweenTicket } from "./HalloweenEventPage";
import { halloweenClassName, halloweenHref, type HalloweenAppearance } from "@/lib/halloween-appearance";

type Guest = { name: string; phone: string };
const steps = ["Tickets & details", "Payment"];

export function HalloweenBookingFlow({ event, preview, appearance = "paper", whatsapp = SITE_COPY_DEFAULTS.contact_whatsapp }: { event: PlanetEvent; preview: boolean; appearance?: HalloweenAppearance; whatsapp?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [guests, setGuests] = useState<Record<number, Guest>>({0:{name:"",phone:""}});
  const [quantityInput, setQuantityInput] = useState("1");
  const [promoInput, setPromoInput] = useState("");
  const [guestPage, setGuestPage] = useState(0);
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [method, setMethod] = useState<"manual" | "paymob">("manual");
  const [proof, setProof] = useState<PaymentProofValue | null>(null);
  const [booking, setBooking] = useState<{ number: string; token?: string } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const submissionId = useRef<string | null>(null);
  const quantity = Number(quantityInput);
  const quantityValid = Number.isSafeInteger(quantity) && quantity >= 1 && (event.capacity === undefined || quantity <= event.capacity);
  const promoCode = promoInput.trim().toUpperCase();
  const promoInvalid = promoCode.length > 0 && (promoCode !== "FOFA" || !quantityValid || quantity < 5);
  const discountPercent = promoCode === "FOFA" && quantityValid && quantity >= 5 ? (quantity >= 15 ? 40 : quantity >= 10 ? 25 : 10) : 0;
  const subtotal = quantityValid && event.priceEgp ? event.priceEgp * quantity : undefined;
  const discountEgp = subtotal === undefined ? 0 : Math.round(subtotal * discountPercent / 100 * 100) / 100;
  const discountedSubtotal = subtotal === undefined ? undefined : subtotal - discountEgp;
  const bookingFees = quantityValid ? (event.bookingFeeEgp ?? 0) * quantity : 0;
  const total = discountedSubtotal === undefined ? undefined : discountedSubtotal + bookingFees;
  const activeGuests = Object.entries(guests).filter(([index]) => Number(index) < quantity).sort(([a],[b]) => Number(a)-Number(b)).map(([,guest])=>guest);
  const valid = !promoInvalid && quantityValid && total !== undefined && Number.isFinite(total) && total <= 9999999999.99 && activeGuests.length === quantity && activeGuests.every(g => g.name.trim().length >= 2 && g.phone.trim().length >= 6) && agreed && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const pageSize = 5;
  const pageCount = quantityValid ? Math.ceil(quantity / pageSize) : 0;
  const visibleGuestIndexes = Array.from({length:quantityValid ? Math.min(pageSize, quantity - guestPage * pageSize) : 0},(_,index)=>guestPage * pageSize + index);
  function resize(value: string) {
    setQuantityInput(value);
    const next = Number(value);
    setGuestPage(current => Number.isSafeInteger(next) && next >= 1 ? Math.min(current, Math.ceil(next / pageSize)-1) : 0);
  }
  function updateGuest(index: number, patch: Partial<Guest>) {
    setGuests(current=>({...current,[index]:{...(current[index] ?? {name:"",phone:""}),...patch}}));
  }
  function submit() {
    setError("");
    if (!valid) { setError("Check the guest details and accept the event policies."); return; }
    if (preview) {
      const number = "PREVIEW-" + crypto.randomUUID().slice(0,8).toUpperCase();
      try {
        const saved = JSON.parse(localStorage.getItem("pi-halloween-preview-v1") ?? "[]");
        localStorage.setItem("pi-halloween-preview-v1",JSON.stringify([...(Array.isArray(saved) ? saved : []),{reference:number,name:guests[0].name,guestCount:quantity,method,total,status:"Preview · not paid",createdAt:new Date().toISOString()}]));
        setBooking({number});
      } catch { setError("The browser could not save the preview booking. Please allow local storage and retry."); }
      return;
    }
    if (!total) { setError("Ticket sales open once the price is confirmed."); return; }
    if (method === "manual" && !proof) { setError("Upload your payment receipt first."); return; }
    submissionId.current ??= crypto.randomUUID();
    startTransition(async()=>{
      const result = await submitPublicEventBooking({eventId:event.id,submissionId:submissionId.current!,email,guests:activeGuests,termsAccepted:agreed,paymentMethod:method,paymentProof:method === "manual" ? proof : null,promoCode:promoCode || null});
      if (!result.ok) { setError(result.error); return; }
      setBooking({number:result.bookingNumber,token:result.paymentToken});
      if (method === "manual" && result.paymentToken) router.push(`/pay/${result.paymentToken}`);
    });
  }
  if(preview && booking) return <EventTicketStatus token="demo" preview previewMethod={method} initial={{reference:booking.number,title:event.title,name:guests[0].name,guests:activeGuests.map(g=>g.name),quantity,date:"2026-10-30T19:00:00+02:00",endDate:"2026-10-31T02:00:00+02:00",venue:event.venue??"Cairo",ticketLabel:event.ticketLabel??"Early Bird",subtotal:discountedSubtotal??0,fees:bookingFees,total:total??0,paid:0,status:method==="manual"?"pending":"unpaid",issuedAt:null}}/>;
  return <div className={halloweenClassName(appearance)}>
    {preview ? <HalloweenPreviewBar appearance={appearance} booking/> : null}
    <div className="hw-wrap">
      <div className="hw-topline"><Link href={halloweenHref(appearance)}>← Back to the night</Link><span>Halloween / 30.10.26</span></div>
      <section className="hw-checkout">
        <p className="hw-eyebrow">Your world starts here</p><h1>Make it a night.</h1>
        <div className="hw-checkout-grid">
          <div className="hw-form">
            {booking ? <div aria-live="polite">
              <h2>{preview ? "Preview booking saved." : method === "paymob" ? "Complete your payment." : "Receipt awaiting verification."}</h2>
              <p className="hw-notice">Reference: <strong>{booking.number}</strong><br/>{preview ? "This is a local demonstration. No money has been charged and no ticket has been issued. Your entry is visible in the admin preview in this browser." : "Your booking is not an entry ticket. Full verified payment and Planet Infinity review are required before final confirmation. Door selection applies."}</p>
              {booking.token && method === "paymob" ? <PaymobPixelCheckout paymentToken={booking.token} returnPath={`/pay/${booking.token}`}/> : null}
              {booking.token ? <Link className="hw-text-link" href={`/pay/${booking.token}`}>View booking and ticket status ↗</Link> : null}
              {preview ? <Link className="hw-button" href="/preview/halloween/admin">View in admin preview ↗</Link> : null}
            </div> : <>
              <ol className="hw-progress" aria-label="Booking progress">{steps.map((label,index)=><li key={label} aria-current={step === index ? "step" : undefined}>0{index+1} / {label}</li>)}</ol>
              {step === 0 ? <>
                <h2>Your tickets. Your people.</h2>
                <p>Choose how many are coming. Your total updates as you go.</p>
                <label className="hw-field" htmlFor="hw-quantity">Number of tickets</label>
                <div className="hw-quantity-picker"><div className="hw-quantity-control"><button type="button" aria-label="Remove one ticket" disabled={!quantityValid || quantity <= 1} onClick={()=>resize(String(quantity-1))}>−</button><input id="hw-quantity" type="number" min={1} max={event.capacity} step={1} inputMode="numeric" required value={quantityInput} onChange={e=>resize(e.target.value)} aria-describedby="hw-live-total"/><button type="button" aria-label="Add one ticket" disabled={quantityValid && event.capacity !== undefined && quantity >= event.capacity} onClick={()=>resize(String(quantityValid ? quantity+1 : 1))}>+</button></div><div className="hw-quantity-total" id="hw-live-total" aria-live="polite" aria-atomic="true"><span>Total · {event.priceEgp?.toLocaleString("en-US")} EGP / person</span><strong>{total ? total.toLocaleString("en-US") + " EGP" : "Enter a valid quantity"}</strong></div></div>
                <label className="hw-field" htmlFor="hw-promo">Group promo code (optional)</label>
                <input className="hw-input" id="hw-promo" autoCapitalize="characters" maxLength={32} placeholder="Enter your group code" value={promoInput} onChange={e=>setPromoInput(e.target.value)}/>
                {promoCode === "FOFA" && !promoInvalid ? <p className="hw-smallprint" role="status">FOFA applied · {discountPercent}% off tickets · {discountEgp.toLocaleString("en-US")} EGP saved</p> : null}
                {promoInvalid ? <p className="hw-error" role="alert">{promoCode !== "FOFA" ? "Invalid promo code." : "FOFA requires at least 5 tickets in one booking."}</p> : null}
                <label className="hw-field" htmlFor="hw-email">Booking email</label>
                <input className="hw-input" id="hw-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/>
                {visibleGuestIndexes.map(index=>{const guest=guests[index] ?? {name:"",phone:""};return <fieldset key={index}><legend>Guest {index+1}{index===0 ? " / booking contact" : ""}</legend><div className="hw-field-row">
                  <div><label className="hw-field" htmlFor={"hw-name-"+index}>Full name</label><input className="hw-input" id={"hw-name-"+index} autoComplete={index===0 ? "name" : "off"} required maxLength={120} value={guest.name} onChange={e=>updateGuest(index,{name:e.target.value})}/></div>
                  <div><label className="hw-field" htmlFor={"hw-phone-"+index}>Mobile number</label><input className="hw-input" id={"hw-phone-"+index} type="tel" autoComplete={index===0 ? "tel" : "off"} required maxLength={40} value={guest.phone} onChange={e=>updateGuest(index,{phone:e.target.value})}/></div>
                </div></fieldset>;})}
                {pageCount > 1 ? <nav className="hw-guest-pagination" aria-label="Guest details pages"><button type="button" disabled={guestPage===0} onClick={()=>setGuestPage(page=>page-1)}>← Previous guests</button><span>Guests {guestPage*pageSize+1}–{Math.min(quantity,(guestPage+1)*pageSize)} of {quantity}</span><button type="button" disabled={guestPage+1>=pageCount} onClick={()=>setGuestPage(page=>page+1)}>Next guests →</button></nav> : null}
                <details className="hw-faq"><summary>Admission requirements</summary><ul>{event.importantInformation?.map(term=><li key={term}>{term}</li>)}</ul></details>
                <label className="hw-check-row"><input type="checkbox" required checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span>I agree to the <Link href="/policies/events-payment" target="_blank">event payment and confirmation policy</Link>, admission requirements and <Link href="/policies/privacy" target="_blank">Privacy Policy</Link>. All guests meet the age and admission requirements.</span></label>
              </> : null}
              {step === 1 ? <>
                <h2>One final step.</h2><p>Pay in full. Choose the method that works for you.</p>
                <dl className="hw-review"><div><dt>{event.ticketLabel ?? "Tickets"}</dt><dd>{quantity} × {event.priceEgp?.toLocaleString("en-US")} EGP</dd></div><div><dt>Ticket subtotal</dt><dd>{subtotal?.toLocaleString("en-US")} EGP</dd></div>{discountPercent > 0 ? <div><dt>FOFA · {discountPercent}% group discount</dt><dd>−{discountEgp.toLocaleString("en-US")} EGP</dd></div> : null}<div><dt>Booking fees · {event.bookingFeeEgp ?? 0} EGP × {quantity}</dt><dd>{bookingFees.toLocaleString("en-US")} EGP</dd></div><div><dt>Total due now · 100%</dt><dd>{total ? total.toLocaleString("en-US")+" EGP" : "Price not set"}</dd></div></dl>
                {preview ? <p className="hw-notice">Local preview. No money will be transferred or charged. You can save a demonstration booking to see how it appears in admin.</p> : null}
                <label className="hw-choice"><input type="radio" name="event-payment" checked={method === "manual"} onChange={()=>setMethod("manual")}/><span><strong>InstaPay / Vodafone Cash</strong><small>Transfer in full, then upload your receipt for verification.</small></span></label>
                <label className="hw-choice"><input type="radio" name="event-payment" checked={method === "paymob"} onChange={()=>setMethod("paymob")}/><span><strong>Pay online with Visa</strong><small>Visa · Mastercard · Secure card checkout</small></span></label>
                {preview && method === "manual" ? <div className="hw-notice"><p>Preview receipt upload · no transfer is required.</p><button className="hw-button" type="button" onClick={()=>setProof({method:"instapay",path:"demo-only",fileName:"demo-receipt.png"})}>{proof?"Demo screenshot attached ✓":"Use demo transfer screenshot"}</button></div> : null}
                {method === "manual" && total ? <PaymentProofStep preview={preview} tripId={event.id} productType="event" totalEgp={total} value={proof} onChange={setProof}/> : null}
                <p className="hw-smallprint">Payment does not guarantee admission. Door selection applies. Exact location sent one day before the event.</p>
              </> : null}
              <div className="hw-form-actions">
                <button type="button" className="hw-button hw-button--light" disabled={step===0 || pending} onClick={()=>{setError("");setStep(0);}}>← Back</button>
                {step === 0 ? <button type="button" className="hw-button" disabled={!valid} onClick={()=>setStep(1)}>Continue to payment →</button> : <button type="button" className="hw-button" onClick={submit} disabled={pending || (!preview && (!total || (method === "manual" && !proof)))}>{pending ? "Saving…" : preview ? "Continue demo booking ↗" : method === "paymob" ? "Continue to Visa ↗" : "Submit for verification ↗"}</button>}
              </div>
              {error ? <p role="alert" className="hw-error">{error}</p> : null}
            </>}
            <div className="hw-help"><p>Need help booking?</p><a className="hw-text-link" href={`https://wa.me/${whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent("Hi Planet Infinity! I need help booking the Halloween party.")}`} target="_blank" rel="noreferrer">Chat on WhatsApp ↗ <span>{whatsapp}</span></a></div>
          </div>
          <HalloweenTicket event={event} appearance={appearance}><div className="hw-smallprint" aria-live="polite">{quantityValid ? quantity : "—"} ticket{quantity>1?"s":""} · <strong>{total ? total.toLocaleString("en-US")+" EGP total" : "Choose a quantity"}</strong><br/>Full payment required. No trip deposit.</div></HalloweenTicket>
        </div>
      </section>
    </div>
  </div>;
}

