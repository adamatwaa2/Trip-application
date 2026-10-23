"use client";
import Link from "next/link";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { bookSpookyHaus } from "@/app/actions/spooky-haus";
import { PaymobPixelCheckout } from "@/components/PaymobPixelCheckout";
import { SpookyHausPrice, useSpookyPrice } from "@/components/SpookyHausPrice";
import type { EventPriceSchedule } from "@/lib/scheduled-event-price";
type Guest = { name: string; phone: string };
export function SpookyHausBookingForm({ price, schedule }: { price: number; schedule?: EventPriceSchedule }) {
 const [quantity, setQuantity] = useState(""), [group,setGroup] = useState(""), [guests,setGuests] = useState<Record<number,Guest>>({}), [terms,setTerms] = useState(false), [rules,setRules] = useState(false), [error,setError] = useState("");
 const [booking,setBooking] = useState<{bookingNumber:string;paymentToken:string;totalEgp:number}|null>(null), [pending,startTransition] = useTransition();
 const submission = useRef<string | null>(null);
 const currentPrice = useSpookyPrice(price,schedule), n = Number(quantity), min = group === "girls-only" ? 1 : 2;
 const validQuantity = ["couple","mixed-group","girls-only"].includes(group) && Number.isSafeInteger(n) && n >= min && n <= 100 && (group !== "couple" || n === 2);
 function changeGuest(i:number,key:keyof Guest,value:string) { setGuests(s=>({...s,[i]:{name:s[i]?.name??"",phone:s[i]?.phone??"",[key]:value}})); }
 function submit(e:FormEvent<HTMLFormElement>) {
  e.preventDefault(); if (!validQuantity) {setError("Check the number of tickets for your group.");return;}
  const form = new FormData(e.currentTarget); setError(""); submission.current ??= crypto.randomUUID();
  startTransition(async()=>{try {
   const result = await bookSpookyHaus({submissionId:submission.current!,email:String(form.get("email")??""),guests:Array.from({length:n},(_,i)=>guests[i]??{name:"",phone:""}),groupType:group,termsAccepted:terms,rulesAccepted:rules});
   if(result.ok)setBooking(result); else setError(result.error);
  }catch{setError("Connection interrupted. Please retry to recover your booking safely.");}});
 }
 if(booking) return <section className="sh-payment sh-form"><p className="sh-kicker">Secure checkout</p><h2>Complete your payment.</h2><p>Booking <strong>{booking.bookingNumber}</strong></p><div className="sh-total"><span>Total due now</span><strong>{booking.totalEgp.toLocaleString("en-EG")} EGP</strong></div><p>Your tickets are confirmed after successful payment. The total shown here is the final price checked when your booking was created.</p><PaymobPixelCheckout paymentToken={booking.paymentToken} returnPath={`/pay/${booking.paymentToken}`} primaryColor="#8e421f" /><Link href={`/pay/${booking.paymentToken}`}>View booking & ticket status ↗</Link></section>;
 return <div className="sh-booking-grid"><form className="sh-form" onSubmit={submit}>
  <p className="sh-kicker">Tickets & guest details</p><h2>Bring your people.</h2>
  <fieldset className="sh-group-picker"><legend>Who is coming?</legend><div className="sh-group-options">{[
   {value:"couple",label:"Couple",hint:"2 guests"},
   {value:"mixed-group",label:"Mixed group",hint:"Choose your group size"},
   {value:"girls-only",label:"Girls only",hint:"1 or more guests"},
  ].map(option=><label className="sh-group-choice" data-selected={group===option.value?"true":undefined} key={option.value}><input type="radio" name="groupType" required value={option.value} checked={group===option.value} onChange={()=>{setGroup(option.value);setQuantity(option.value==="couple"?"2":option.value==="girls-only"?"1":"");}} /><span><strong>{option.label}</strong><small>{option.hint}</small></span></label>)}</div></fieldset>
  {group ? group==="couple" ? <p className="sh-group-note">One couple · 2 tickets</p> : <label>Number of tickets<input type="number" min={min} max={100} step={1} required value={quantity} placeholder="How many are coming?" onChange={e=>setQuantity(e.target.value)} /></label> : <p className="sh-group-note">Choose your group first. No tickets are selected yet.</p>}
  <label>Booking email<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
  {Array.from({length:validQuantity?n:0},(_,i)=><fieldset key={i}><legend>Guest {i+1}{i===0?" · Booking contact":""}</legend><div className="sh-form-row"><label>Full name<input required minLength={2} maxLength={120} autoComplete={i===0?"name":"off"} value={guests[i]?.name??""} onChange={e=>changeGuest(i,"name",e.target.value)} /></label><label>Mobile number<input required type="tel" minLength={6} maxLength={40} autoComplete={i===0?"tel":"off"} value={guests[i]?.phone??""} onChange={e=>changeGuest(i,"phone",e.target.value)} /></label></div></fieldset>)}
  <label className="sh-check"><input type="checkbox" required checked={rules} onChange={e=>setRules(e.target.checked)} /><span>Every guest is 18+. We are a couple, mixed group or girls-only. Costumes are mandatory. No alcohol or drugs are allowed.</span></label>
  <label className="sh-check"><input type="checkbox" required checked={terms} onChange={e=>setTerms(e.target.checked)} /><span>I accept the <Link href="/policies/events-payment" target="_blank">event payment policy</Link> and <Link href="/policies/privacy" target="_blank">Privacy Policy</Link>.</span></label>
  {error?<p className="sh-error" role="alert">{error}</p>:null}
  <button className="sh-button" type="submit" disabled={pending||!validQuantity}>{pending?"Preparing secure checkout…":"Continue to payment ↗"}</button><p className="sh-small">Direct ticket booking. Pay securely by card with Paymob.</p>
 </form><aside className="sh-booking-summary"><p className="sh-kicker">Spooky Haus · 29 October</p><h2>Halloween Dinner Party</h2><p>Mokattam, Cairo<br />Doors 7 PM · 8 PM – 12 AM</p><SpookyHausPrice price={price} schedule={schedule} /><div className="sh-total" aria-live="polite"><span>{validQuantity ? `${n} ${n===1?"ticket":"tickets"} · total` : "Choose your group and ticket quantity"}</span><strong>{validQuantity ? `${(currentPrice*n).toLocaleString("en-EG")} EGP` : "—"}</strong></div><p className="sh-small">18+ · Couples, mixed groups or girls-only.<br />Costumes mandatory. No alcohol. No drugs.</p></aside></div>;
}
