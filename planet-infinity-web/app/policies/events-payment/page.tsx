import Link from "next/link";
import { EVENT_PAYMENT_SECTIONS, HALLOWEEN_POLICY_VERSION } from "@/content/events/halloween";
import "@/app/halloween.css";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata={title:"Events — Payment & Booking Confirmation"};
export const dynamic="force-dynamic";
export default async function EventsPaymentPolicy(){
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {data} = await supabase.from("policies").select("title,body,version").eq("slug","events-payment").eq("is_active",true).maybeSingle();
    if (data?.body) return <article className="hw"><div className="hw-wrap"><div className="hw-topline"><Link href="/policies">← All policies</Link><span>Events policy</span></div><section className="hw-section"><p className="hw-eyebrow">Planet Infinity · {data.version}</p><h1 style={{fontSize:"clamp(34px,5vw,64px)",lineHeight:1.1,letterSpacing:"-.05em",maxWidth:800}}>{data.title}</h1>{data.body.split(/\n{2,}/).map((paragraph:string,index:number)=><p key={index} style={{fontSize:14,lineHeight:1.9,maxWidth:760,marginTop:25}}>{paragraph}</p>)}<Link href="/events/halloween-party-2026#hw-terms">Halloween admission requirements ↗</Link></section></div></article>;
  }
  return <article className="hw"><div className="hw-wrap"><div className="hw-topline"><Link href="/policies">← All policies</Link><span>Events policy</span></div><section className="hw-section"><p className="hw-eyebrow">Planet Infinity · {HALLOWEEN_POLICY_VERSION}</p><h1 style={{fontSize:"clamp(34px,5vw,64px)",lineHeight:1.1,letterSpacing:"-.05em",maxWidth:800}}>Events — Payment & Booking Confirmation</h1><p className="hw-description" style={{margin:"25px 0",maxWidth:650}}>This policy applies to event tickets. The trip deposit and balance policy does not apply to events.</p>{EVENT_PAYMENT_SECTIONS.map(section=><section key={section.title} style={{maxWidth:760,padding:"25px 0",borderTop:"1px solid #14171333"}}><h2 style={{fontSize:23}}>{section.title}</h2><p style={{fontSize:14,lineHeight:1.9}}>{section.text}</p></section>)}<Link href="/events/halloween-party-2026#hw-terms" className="hw-text-link">Read Halloween admission requirements ↗</Link></section></div></article>;
}
