"use client";
import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { submitPublicRequest } from "@/app/actions/requests";
import { PolicyAcceptance } from "@/components/PolicyAcceptance";
import { SpookyHausPrice, useSpookyPrice } from "@/components/SpookyHausPrice";
import type { EventPriceSchedule } from "@/lib/scheduled-event-price";
export function SpookyHausBookingForm({ eventId, title, price, schedule }: { eventId: string; title: string; price: number; schedule?: EventPriceSchedule }) {
  const [guests, setGuests] = useState(2);
  const [terms, setTerms] = useState(false);
  const [rules, setRules] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [pending, startTransition] = useTransition();
  const currentPrice = useSpookyPrice(price, schedule);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError("");
    startTransition(async () => {
      try {
        const result = await submitPublicRequest({
          requestType: "event", productId: eventId, subjectSlug: "spooky-haus", subjectTitle: title,
          fullName: String(form.get("fullName") ?? ""), email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""), guestCount: guests,
          selections: { groupType: String(form.get("groupType") ?? ""), rulesConfirmed: rules, unitPriceEgp: currentPrice, totalEgp: currentPrice * guests },
          notes: String(form.get("notes") ?? ""), termsAccepted: terms, whatsappOptIn: form.get("whatsapp") === "on",
        });
        if (result.ok) setReference(result.requestNumber); else setError(result.error);
      } catch { setError("We could not send your request. Please try again."); }
    });
  }
  if (reference) return <section className="sh-confirmation" role="status"><p className="sh-kicker">Request received</p><h2>We have your invitation request.</h2><p>Your reference: <strong>{reference}</strong></p><p>Our team will review your request and contact you with the next steps. This is not a confirmed ticket, and no payment has been taken.</p><Link className="sh-button" href="/events/spooky-haus">Back to the evening ↗</Link></section>;
  return <div className="sh-booking-grid">
    <form className="sh-form" onSubmit={submit}>
      <p className="sh-kicker">Your invitation request</p><h2>Who is coming?</h2>
      <div className="sh-form-row"><label>Full name<input name="fullName" autoComplete="name" required minLength={2} maxLength={120} placeholder="Your full name" /></label><label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label></div>
      <label>Mobile / WhatsApp<input name="phone" type="tel" autoComplete="tel" required minLength={6} maxLength={40} placeholder="+20…" /></label>
      <div className="sh-form-row"><label>Your group<select name="groupType" required defaultValue=""><option value="" disabled>Select your group</option><option value="couple">Couple</option><option value="mixed-group">Mixed group</option></select></label><label>Number of guests<input name="guestCount" type="number" min={2} max={100} step={1} required value={guests} onChange={e => setGuests(Number(e.target.value))} /></label></div>
      <label>Anything you would like us to know? <span className="sh-optional">(optional)</span><textarea name="notes" rows={3} maxLength={2000} placeholder="Tell us a little about your group…" /></label>
      <label className="sh-check"><input type="checkbox" required checked={rules} onChange={e => setRules(e.target.checked)} /><span>I confirm that every guest is 18+, we are a couple or mixed group, costumes are mandatory, and no alcohol or drugs are allowed.</span></label>
      <PolicyAcceptance id="spooky-policy" checked={terms} onChange={setTerms} />
      <label className="sh-check"><input name="whatsapp" type="checkbox" /><span>Send me updates about this request on WhatsApp. (Optional)</span></label>
      {error ? <p className="sh-error" role="alert">{error}</p> : null}
      <button className="sh-button" type="submit" disabled={pending}>{pending ? "Sending your request…" : "Send invitation request ↗"}</button>
      <p className="sh-small">Subject to team review. No payment is taken here.</p>
    </form>
    <aside className="sh-booking-summary"><p className="sh-kicker">Spooky Haus · Halloween Dinner Party</p><h2>Dinner after dark.</h2><p>29 October 2026<br />Doors 7 PM · Party 8 PM – 12 AM<br />CUCA Club · Mokattam, Cairo</p><SpookyHausPrice price={price} schedule={schedule} /><div className="sh-total"><span>{guests || 0} guests · estimated total</span><strong>{(currentPrice * (guests || 0)).toLocaleString("en-EG")} EGP</strong></div><p className="sh-small">The current price is checked again when your request is submitted. Final availability and payment are confirmed separately by the team.</p><div className="sh-rule-list"><span>Private community</span><span>Limited places</span><span>18+</span><span>Couples & mixed groups</span><span>No alcohol · No drugs</span></div></aside>
  </div>;
}
