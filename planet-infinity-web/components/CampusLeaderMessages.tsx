"use client";
import {useState} from "react";
import type {PercentTier} from "@/lib/campus-pricing";

export function CampusLeaderMessages({code,discounts}:{code:string;discounts:PercentTier[]}){
 const [status,setStatus]=useState('');
 const tierText=discounts.map((tier,i)=>`${tier.from}${discounts[i+1]?`–${discounts[i+1].from-1}`:'+'}: ${tier.percent}%`).join(' · ');
 const english=`Planet Infinity Halloween — 30 October 🎃🔥

Big Halloween energy: DJ sets, live performances, horror acts, a photo booth and a full-on Halloween setup. Food & drinks available!

Use my promo code ${code} for ticket discounts in ONE booking:
${tierText}.

Book together for a bigger discount! Booking fees are separate.

Early Bird tickets could go fast — prices rise as tickets sell.

With this promo code: men & women 18+; mixed groups 50:50, couples or girls-only.

Book: www.PlanetInfinity.online
Follow for updates: @planetinfinity.ent`;
 const arabic=`Planet Infinity Halloween — يوم 30 أكتوبر 🎃🔥

حفلة كبيرة بـDJ sets جامدة، live performances، فقرات رعب، photo booth وHalloween setup رهيب! وأكل وشرب متاحين 🙌

استخدموا البرومو كود بتاعي ${code} لخصم على التذاكر حسب العدد في حجز واحد:
${tierText}.

اتجمعوا واحجزوا مع بعض عشان تاخدوا خصم أكبر! رسوم الحجز منفصلة.

تذاكر Early Bird محدودة وممكن تخلص بسرعة، والأسعار بتزيد مع البيع.

بالبرومو كود ده: شباب وبنات 18+، mixed groups بنسبة 50:50، أو couples أو girls-only.

الحجز: www.PlanetInfinity.online
اعملوا Follow للتحديثات: @planetinfinity.ent`;
 async function copy(text:string){try{await navigator.clipboard.writeText(text);setStatus('Copied. Paste it into your group chat.');}catch{setStatus('Select and copy the message below.');}}
 return <section><h2>Ready to share.</h2><p>Your code is active. Copy a message and send it to your group. Messages are not sent automatically.</p><h3>English</h3><p style={{whiteSpace:'pre-wrap'}}>{english}</p><button className="hw-button" onClick={()=>copy(english)}>Copy English message</button><h3>العربي</h3><p dir="rtl" lang="ar" style={{whiteSpace:'pre-wrap'}}>{arabic}</p><button className="hw-button" onClick={()=>copy(arabic)}>نسخ الرسالة العربية</button><p role="status">{status}</p></section>;
}
