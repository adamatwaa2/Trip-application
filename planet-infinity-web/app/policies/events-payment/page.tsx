import Link from "next/link";
import { EVENT_PAYMENT_SECTIONS } from "@/content/events/halloween";
import "@/app/halloween.css";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata={title:"Events — Payment & Booking Confirmation"};
export const dynamic="force-dynamic";
export default async function EventsPaymentPolicy(){
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {data} = await supabase.from("policies").select("title,body,version").eq("slug","events-payment").eq("is_active",true).maybeSingle();
    if (data?.body) {
      // Preserve the dated accepted version in storage; identify the update clearly in the public copy.
      const displayBody = data.body.replace("Effective for new bookings confirmed after publication on 31 October 2026. Earlier bookings remain subject to the terms agreed when they were confirmed.", "Updated terms for new bookings only. These terms do not apply retroactively; earlier bookings remain subject to the terms agreed when they were confirmed.");
      return <article className="hw"><div className="hw-wrap"><div className="hw-topline"><Link href="/policies">← All policies</Link><span>Events policy</span></div><section className="hw-section"><p className="hw-eyebrow">Planet Infinity · Updated event policy</p><h1 style={{fontSize:"clamp(34px,5vw,64px)",lineHeight:1.1,letterSpacing:"-.05em",maxWidth:800}}>{data.title}</h1>{displayBody.split(/\n{2,}/).map((paragraph:string,index:number)=><p key={index} style={{fontSize:14,lineHeight:1.9,maxWidth:760,marginTop:25}}>{paragraph}</p>)}</section></div></article>;
    }
  }
  return <article className="hw"><div className="hw-wrap"><div className="hw-topline"><Link href="/policies">← All policies</Link><span>Events policy</span></div><section className="hw-section"><p className="hw-eyebrow">Planet Infinity · Event policy</p><h1 style={{fontSize:"clamp(34px,5vw,64px)",lineHeight:1.1,letterSpacing:"-.05em",maxWidth:800}}>Events — Payment & Booking Confirmation</h1><p className="hw-description" style={{margin:"25px 0",maxWidth:650}}>This policy applies to event tickets. The trip deposit and balance policy does not apply to events.</p>{EVENT_PAYMENT_SECTIONS.map(section=><section key={section.title} style={{maxWidth:760,padding:"25px 0",borderTop:"1px solid #14171333"}}><h2 style={{fontSize:23}}>{section.title}</h2><p style={{fontSize:14,lineHeight:1.9}}>{section.text}</p></section>)}</section></div></article>;
}
