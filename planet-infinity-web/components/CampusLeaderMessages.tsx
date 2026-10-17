"use client";
import {useState} from "react";
import type {PercentTier} from "@/lib/campus-pricing";

export function CampusLeaderMessages({code,discounts}:{code:string;discounts:PercentTier[]}){
 const [status,setStatus]=useState('');
 const tierText=discounts.map((tier,i)=>`${tier.from}${discounts[i+1]?`–${discounts[i+1].from-1}`:'+'}: ${tier.percent}%`).join(' · ');
 const english=`Who's joining Planet Infinity's Halloween night? 🎃

Book at www.PlanetInfinity.online and enter my code ${code} at checkout for these ticket discounts in ONE booking:
${tierText}.

Bring your people and book together to unlock a bigger discount. Separate bookings are not combined for group discounts. Booking fees are shown separately before payment.

Early Bird tickets are limited and prices rise as tickets sell. Your exact total appears before payment.

With this university code: men and women 18+. Mixed groups must be 50:50, couples or girls-only.

www.PlanetInfinity.online
Instagram: @planetinfinity.ent`;
 const arabic=`مين جاي معانا ليلة Halloween مع Planet Infinity؟ 🎃

احجز من www.PlanetInfinity.online وحط كودي ${code} عند الحجز، وخد خصم على التذاكر حسب العدد في حجز واحد:
${tierText}.

اتجمعوا واحجزوا مع بعض عشان تاخدوا خصم أكبر! الحجوزات المنفصلة مش بتتجمع لحساب خصم الجروب. رسوم الحجز بتظهر منفصلة قبل الدفع.

تذاكر Early Bird محدودة والأسعار بتزيد مع التذاكر المباعة. الإجمالي الدقيق بيظهر قبل الدفع.

بالكود الجامعي ده: الشباب والبنات 18 سنة أو أكتر، والجروبات المختلطة بنسبة 50:50، أو couples أو girls-only.

www.PlanetInfinity.online
Instagram: @planetinfinity.ent`;
 async function copy(text:string){try{await navigator.clipboard.writeText(text);setStatus('Copied. Paste it into your group chat.');}catch{setStatus('Select and copy the message below.');}}
 return <section><h2>Ready to share.</h2><p>Your code is active. Copy a message and send it to your group. Messages are not sent automatically.</p><h3>English</h3><p style={{whiteSpace:'pre-wrap'}}>{english}</p><button className="hw-button" onClick={()=>copy(english)}>Copy English message</button><h3>العربي</h3><p dir="rtl" lang="ar" style={{whiteSpace:'pre-wrap'}}>{arabic}</p><button className="hw-button" onClick={()=>copy(arabic)}>نسخ الرسالة العربية</button><p role="status">{status}</p></section>;
}
