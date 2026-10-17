"use client";
import Link from "next/link";
import { useState,useTransition } from "react";
import { saveAmbassador,saveSalesRules,issueAmbassadorEntry,reviewCampusApplication } from "@/app/actions/campus-ambassadors";
import type { PercentTier,PriceTier } from "@/lib/campus-pricing";
export type Ambassador={id:string;name:string;university:string;email:string;phone:string;is_active:boolean;codes:{code:string;active:boolean}[];confirmed_tickets:number;commission:number;entry_token:string|null};
export function CampusApplicationReview({id,status}:{id:string;status:string}){
 const [prefix,setPrefix]=useState(''),[message,setMessage]=useState(''),[pending,startTransition]=useTransition();
 if(status==='approved')return <span>Approved · ambassador created below</span>;
 function review(approve:boolean){startTransition(async()=>{try{const result=await reviewCampusApplication(id,approve,prefix);setMessage(result.ok?(approve?'Approved. The personal code is in the ambassador list.':'Application rejected.'):result.error??'Could not save.');}catch{setMessage('Could not save. Try again.');}});}
 return <div className="pi-admin-status-form"><label>Group short name<input placeholder="FOFA or AUC" maxLength={10} value={prefix} onChange={e=>setPrefix(e.target.value.toUpperCase())}/></label><button className="pi-admin-button" disabled={pending||!/^[A-Z]{2,10}$/.test(prefix)} onClick={()=>review(true)}>Approve & generate code</button>{status!=='rejected'?<button disabled={pending} onClick={()=>review(false)}>Reject application</button>:null}<p role="status">{message}</p></div>;
}
export function AmbassadorForm({eventId,ambassador,preview=false,usedCodes=[],onDemoSave}:{eventId:string;ambassador?:Ambassador;preview?:boolean;usedCodes?:string[];onDemoSave?:(ambassador:Ambassador)=>void}){
 const [message,setMessage]=useState("");const [pending,startTransition]=useTransition();
 const currentCode=ambassador?.codes.find(c=>c.active)?.code??ambassador?.codes.at(-1)?.code??"";
 const [prefix,setPrefix]=useState(currentCode.includes('-')?currentCode.split('-')[0]:"");
 return <form className="pi-admin-form" action={form=>{startTransition(async()=>{try{
  if(preview){
   let generated=currentCode;
   if(!generated||form.get('regenerate')==='on')for(let i=1;i<=702;i++){const suffix=i<=26?String.fromCharCode(64+i):String.fromCharCode(65+Math.floor((i-27)/26))+String.fromCharCode(65+(i-27)%26);const candidate=prefix.trim().toUpperCase()+'-'+suffix;if(!usedCodes.includes(candidate)){generated=candidate;break;}}
   onDemoSave?.({id:ambassador?.id??crypto.randomUUID(),name:String(form.get('name')),university:String(form.get('university')),email:String(form.get('email')),phone:String(form.get('phone')),is_active:form.get('active')==='on',codes:[...(ambassador?.codes??[]).map(c=>({...c,active:false})),{code:generated,active:form.get('active')==='on'}],confirmed_tickets:0,commission:0,entry_token:null});setMessage(`Demo saved · ${generated}. No real ambassador or code was created.`);return;
  }
  const result=await saveAmbassador(form);setMessage(result.ok?"Ambassador saved. The assigned code appears in the ambassador list below.":result.error??"Could not save.");
 }catch{setMessage("Could not save. Try again.");}});}}>
  <input type="hidden" name="eventId" value={eventId}/><input type="hidden" name="id" value={ambassador?.id??""}/>
  <div className="pi-admin-form__grid pi-admin-form__grid--two">{[['name','Full name',ambassador?.name],['university','University / group',ambassador?.university],['email','Email',ambassador?.email],['phone','Phone',ambassador?.phone]].map(([name,label,value])=><label key={name}><span>{label}</span><input name={name} defaultValue={value??""} type={name==='email'?'email':'text'} maxLength={120} required={name==='name'}/></label>)}<label>Group short name<input name="prefix" placeholder="FOFA or AUC" value={prefix} onChange={e=>setPrefix(e.target.value.toUpperCase())} maxLength={10} pattern="[A-Za-z]{2,10}" required/></label><label>Assigned code<input name="code" value={currentCode} placeholder="Generated when you save" readOnly/></label></div>
  {ambassador?<label className="pi-admin-check"><input type="checkbox" name="regenerate"/> Generate a new code and retire the current code</label>:null}
  <label className="pi-admin-check"><input type="checkbox" name="active" defaultChecked={ambassador?.is_active??true}/> Active ambassador and code</label>
  <p className="pi-admin-help">Changing a code retires the old code. Existing bookings keep their original attribution. Retired codes cannot be assigned to another ambassador.</p>
  <p className="pi-admin-help">Codes are short and allocated automatically: FOFA-A, FOFA-B, AUC-A. A code only works after it has been saved for an active ambassador.</p>
  <button type="submit" className="pi-admin-button" disabled={pending}>{pending?"Saving…":ambassador?"Save ambassador":"Save & generate code"}</button><p role="status">{message}</p>
 </form>;
}
export function AmbassadorEntry({ambassador}:{ambassador:Ambassador}){
 const [message,setMessage]=useState("");const [token,setToken]=useState(ambassador.entry_token);const [pending,startTransition]=useTransition();
 if(token)return <Link href={`/pay/${token}`} target="_blank">Open complimentary entry ticket ↗</Link>;
 return <div><p className="pi-admin-help">One free entry. Confirm the ambassador meets the university admission requirements and has an original physical ID.</p><button className="pi-admin-button" disabled={pending||!ambassador.is_active} onClick={()=>startTransition(async()=>{try{const result=await issueAmbassadorEntry(ambassador.id);if(result.ok&&result.token)setToken(result.token);else setMessage(result.error??"Could not issue.");}catch{setMessage("Could not issue. Try again.");}})}>{pending?"Issuing…":"Issue free entry"}</button><p role="status">{message}</p></div>;
}
export function SalesRulesForm({eventId,prices,discounts,commissions}:{eventId:string;prices:PriceTier[];discounts:PercentTier[];commissions:PercentTier[]}){
 const [p,setP]=useState(prices),[d,setD]=useState(discounts),[c,setC]=useState(commissions),[message,setMessage]=useState("");const [pending,startTransition]=useTransition();
 function percentRows(label:string,rows:PercentTier[],set:(rows:PercentTier[])=>void){return <fieldset><legend>{label}</legend>{rows.map((t,i)=><div className="pi-admin-form__grid pi-admin-form__grid--two" key={i}><label>From ticket<input type="number" min={1} step={1} value={t.from} onChange={e=>set(rows.map((v,j)=>j===i?{...v,from:Number(e.target.value)}:v))}/></label><label>Percent<input type="number" min={0} max={100} step="0.01" value={t.percent} onChange={e=>set(rows.map((v,j)=>j===i?{...v,percent:Number(e.target.value)}:v))}/></label>{i>0?<button type="button" onClick={()=>set(rows.filter((_,j)=>j!==i))}>Remove tier</button>:null}</div>)}<button type="button" onClick={()=>set([...rows,{from:rows.at(-1)!.from+5,percent:rows.at(-1)!.percent}])}>Add tier</button></fieldset>;}
 return <form className="pi-admin-form" onSubmit={e=>{e.preventDefault();startTransition(async()=>{try{const r=await saveSalesRules(eventId,p,d,c);setMessage(r.ok?"Rules saved for future quotes. Existing bookings and held quotes keep their saved rules.":r.error??"Could not save.");}catch{setMessage("Could not save. Try again.");}});}}><fieldset><legend>Ticket prices by inventory position</legend>{p.map((t,i)=><div className="pi-admin-form__grid pi-admin-form__grid--two" key={i}><label>From ticket<input type="number" min={1} step={1} value={t.from} onChange={e=>setP(p.map((v,j)=>j===i?{...v,from:Number(e.target.value)}:v))}/></label><label>Price EGP<input type="number" min="0.01" step="0.01" value={t.price} onChange={e=>setP(p.map((v,j)=>j===i?{...v,price:Number(e.target.value)}:v))}/></label>{i>0?<button type="button" onClick={()=>setP(p.filter((_,j)=>j!==i))}>Remove tier</button>:null}</div>)}<button type="button" onClick={()=>setP([...p,{from:p.at(-1)!.from+50,price:p.at(-1)!.price}])}>Add price tier</button></fieldset>{percentRows("Customer discount per booking",d,setD)}{percentRows("Commission per confirmed ticket",c,setC)}<button type="submit" className="pi-admin-button" disabled={pending}>{pending?"Saving…":"Save pricing rules"}</button><p role="status">{message}</p></form>;
}
