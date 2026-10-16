import Link from "next/link";
import type { AdminBooking } from "@/lib/admin-operations";
import "@/app/halloween.css";

export function HalloweenAdminOverview({bookings,eventId,error}:{bookings:AdminBooking[];eventId:string;error?:string|null}){
  const active=bookings.filter(b=>b.status!=="cancelled");
  const paid=active.reduce((sum,b)=>sum+Number(b.amount_paid),0);
  const pending=active.filter(b=>Number(b.amount_paid)<Number(b.total_amount)).length;
  return <section className="pi-admin-section"><div className="pi-admin-section__head"><div><p className="pi-admin-kicker">Halloween / Overview</p><h2>Every guest. Every payment.</h2></div><Link href={`/admin/bookings/event/${eventId}`}>View event bookings ↗</Link></div>{error?<p className="pi-admin-error">{error}</p>:<><div className="pi-admin-stats">{[["Bookings",bookings.length],["Active guests",active.reduce((sum,b)=>sum+b.guest_count,0)],["Verified payments",`${paid.toLocaleString("en-US")} EGP`],["Awaiting full payment",pending]].map(([label,value])=><div className="hw-admin-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><p className="pi-admin-help">Events require 100% payment. Uploaded transfers remain pending until verified. Final confirmation is separate from payment and door selection.</p></>}</section>;
}
