"use client";
import Link from "next/link";
import {useState} from "react";
import {AmbassadorForm,type Ambassador} from "./CampusAdminForms";
export function CampusAdminPreview(){
 const [ambassadors,setAmbassadors]=useState<Ambassador[]>([]);
 const codes=ambassadors.flatMap(a=>a.codes.map(c=>c.code));
 return <div className="pi-admin"><main className="pi-admin-main"><header className="pi-admin-page-head"><p className="pi-admin-kicker">Planet Infinity · Demonstration</p><h1>Campus Ambassadors</h1><p>Add a leader and type the exact code you want, such as FOFA-D1. Save checks that the code is unique.</p><p className="pi-admin-help">Preview only. Use invented details. Nothing is saved to the live database, no active discount code is created, and no entry ticket is issued.</p><Link href="/preview/campus">Try the customer checkout ↗</Link></header><section className="pi-admin-section"><h2>Add a leader</h2><AmbassadorForm eventId="preview" preview usedCodes={codes} onDemoSave={a=>setAmbassadors(current=>[...current.filter(item=>item.id!==a.id),a])}/></section><section className="pi-admin-section"><h2>Leaders and individual codes</h2>{ambassadors.length?ambassadors.map(a=><details className="pi-admin-section" key={a.id}><summary><strong>{a.name} · {a.codes.find(c=>c.active)?.code??a.codes.at(-1)?.code}</strong> · {a.university}</summary><p>{a.email} · {a.phone} · {a.is_active?'Active in demo':'Paused in demo'}</p><p>Confirmed tickets: 0 · Commission: 0 EGP</p><AmbassadorForm eventId="preview" ambassador={a} preview usedCodes={codes} onDemoSave={updated=>setAmbassadors(current=>current.map(item=>item.id===updated.id?updated:item))}/></details>):<p>No leaders yet. Add a leader above to save their chosen code.</p>}</section></main></div>;
}
