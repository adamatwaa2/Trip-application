import Link from "next/link";
import {notFound} from "next/navigation";
import {createServiceClient,isSupabaseServiceConfigured} from "@/lib/supabase/service";
import {CampusLeaderMessages} from "@/components/CampusLeaderMessages";
import type {PercentTier} from "@/lib/campus-pricing";
import "@/app/halloween.css";

export const dynamic='force-dynamic';
export const metadata={title:'Your Campus Ambassador code',robots:{index:false,follow:false},referrer:'no-referrer'};

export default async function CampusLeaderStatus({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token))notFound();
 if(!isSupabaseServiceConfigured())return <main className="hw"><div className="hw-wrap"><p>Registration status is unavailable. Please try again later.</p></div></main>;
 const db=createServiceClient();
 const {data:application,error}=await db.from('campus_ambassador_applications').select('full_name,status,requested_code,ambassador_id,event_id').eq('tracking_token',token).maybeSingle();
 if(error)throw new Error('Registration status could not be loaded');
 if(!application)notFound();
 const {data:rules,error:rulesError}=await db.from('event_sales_rules').select('discount_tiers,commission_tiers').eq('event_id',application.event_id).maybeSingle();
 if(rulesError||!rules)throw new Error('Programme rules could not be loaded');
 const discounts=rules.discount_tiers as PercentTier[],commissions=rules.commission_tiers as PercentTier[];
 const commissionText=commissions.map((tier,i)=>`${tier.from}${commissions[i+1]?`–${commissions[i+1].from-1}`:'+'}: ${tier.percent}%`).join(' · ');
 let code:string|null=null;
 if(application.ambassador_id){
  const [{data:ambassador},{data:codes}]=await Promise.all([db.from('campus_ambassadors').select('is_active').eq('id',application.ambassador_id).maybeSingle(),db.from('ambassador_codes').select('code').eq('ambassador_id',application.ambassador_id).eq('is_active',true).limit(1)]);
  if(ambassador?.is_active)code=codes?.[0]?.code??null;
 }
 return <main className="hw"><div className="hw-wrap"><section className="hw-checkout"><p className="hw-eyebrow">Planet Infinity · Campus Ambassadors</p><h1>{code?'Your code is ready.':'Your code status.'}</h1><p>Hi {application.full_name}. Keep this private link for your code and shareable messages. Do not share this page; share only the code and messages below.</p>{code?<><div className="hw-notice"><h2>{code}</h2><p>Active · customers can use this code now. No admin approval is needed.</p></div><CampusLeaderMessages code={code} discounts={discounts}/><h2>Your commission</h2><p>Confirmed, fully paid tickets from all bookings count, including individual bookings. Each ticket earns commission on its saved original price, before customer discounts and excluding booking fees.</p><p>Tickets {commissionText}. Rates apply progressively, not retroactively. Previous tickets keep their saved rates.</p><p>Your complimentary entry is available through the Planet Infinity team.</p></>:<div className="hw-notice"><h2>Code unavailable</h2><p>Your registration is saved, but the code is not currently active. Please contact Planet Infinity. Requested code: {application.requested_code??'Not supplied'}.</p></div>}<p><Link href="/events/halloween-party-2026">View the event ↗</Link> · <Link href="/contact">Contact Planet Infinity ↗</Link></p></section></div></main>;
}
