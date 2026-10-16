"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import type {EventTicketState} from "@/lib/event-ticket";
import {PaymobCheckoutButton} from "./PaymobCheckoutButton";
import "@/app/halloween.css";
import "@/app/halloween-night.css";
import "@/app/halloween-blend.css";

export function EventTicketStatus({token,initial}:{token:string;initial:EventTicketState}){
 const [ticket,setTicket]=useState(initial);const [refreshing,setRefreshing]=useState(false);const [error,setError]=useState("");
 async function refresh(){setRefreshing(true);setError("");try{const response=await fetch(`/api/events/ticket/${token}`,{cache:"no-store"});if(response.ok)setTicket(await response.json());else setError("Could not refresh your booking. Please try again.");}catch{setError("Connection interrupted. Please try again.");}finally{setRefreshing(false);}}
 useEffect(()=>{
  if(ticket.status==="confirmed"||ticket.status==="cancelled")return;
  const controller=new AbortController();let attempts=0;let busy=false;
  const timer=setInterval(async()=>{if(busy||++attempts>60){if(attempts>60)clearInterval(timer);return;}busy=true;try{const response=await fetch(`/api/events/ticket/${token}`,{cache:"no-store",signal:controller.signal});if(response.ok)setTicket(await response.json());}catch{}finally{busy=false;}},3000);
  return()=>{controller.abort();clearInterval(timer);};
 },[token,ticket.status]);
 const confirmed=ticket.status==="confirmed";const cancelled=ticket.status==="cancelled";
 const date=ticket.date?new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Cairo",dateStyle:"full",timeStyle:"short"}).format(new Date(ticket.date)):"Date to be confirmed";
 return <main className="hw hw--night hw--blend"><div className="hw-wrap"><section className="hw-checkout"><p className="hw-eyebrow">Planet Infinity · Halloween</p><h1>{confirmed?"You're on the list.":cancelled?"Booking cancelled.":ticket.status==="pending"?"Your receipt is in.":"Checking your payment."}</h1><p className="hw-smallprint">{confirmed?"Full payment verified. Your event ticket is ready below.":cancelled?"This booking cannot be used for entry.":ticket.status==="pending"?"Your transfer screenshot has been received. Planet Infinity will verify the funds; your ticket appears here after approval.":"Your ticket appears automatically when Paymob confirms successful payment. A browser redirect or screenshot alone does not confirm payment."}</p><div className="hw-ticket" style={{maxWidth:780,margin:"35px auto",transform:"none"}}><div className="hw-ticket-heading"><h3>{confirmed?"E-TICKET · CONFIRMED":"BOOKING · NOT AN ENTRY TICKET"}</h3><span>{ticket.ticketLabel}</span></div><h2 style={{fontSize:36,letterSpacing:"-.04em",margin:"25px 0 10px"}}>{ticket.title}</h2><p style={{fontSize:13}}>{date}</p><dl className="hw-review"><div><dt>Booking reference</dt><dd>{ticket.reference}</dd></div><div><dt>Booking contact</dt><dd>{ticket.name}</dd></div><div><dt>Guests / tickets</dt><dd>{ticket.quantity}</dd></div><div><dt>Tickets</dt><dd>{ticket.subtotal.toLocaleString("en-US")} EGP</dd></div><div><dt>Booking fees</dt><dd>{ticket.fees.toLocaleString("en-US")} EGP</dd></div><div><dt>Total / verified paid</dt><dd>{ticket.total.toLocaleString("en-US")} / {ticket.paid.toLocaleString("en-US")} EGP</dd></div></dl>{confirmed?<><a className="hw-button" href={`/pay/${token}/ticket`} download>Download ticket confirmation PDF ↗</a><p className="hw-smallprint">Bring your original physical ID. Door selection applies. Non-refundable and non-transferable, subject to applicable law. Your exact location will be sent one day before the event.</p></>:!cancelled?<><button className="hw-button" type="button" disabled={refreshing} onClick={refresh}>{refreshing?"Checking…":"Refresh booking status ↻"}</button><p className="hw-smallprint">Keep this private link to return to your ticket. Do not pay twice while a transfer or Paymob transaction is being verified.</p>{ticket.status==="unpaid"?<PaymobCheckoutButton paymentToken={token}/>:null}</>:null}</div>{error?<p role="alert" className="hw-error">{error}</p>:null}<Link className="hw-text-link" href="/events/halloween-party-2026">Back to the event ↗</Link></section></div></main>;
}
