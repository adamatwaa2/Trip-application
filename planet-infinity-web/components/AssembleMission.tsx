"use client";
import Link from "next/link";
import {useRef,useState} from "react";
import styles from "./AssembleMission.module.css";

const roles=[{name:"The strategist",line:"See the bigger picture.",symbol:"◎"},{name:"The protector",line:"Have your team’s back.",symbol:"◇"},{name:"The spark",line:"Bring the unexpected.",symbol:"ϟ"},{name:"The original",line:"Write your own origin story.",symbol:"✦"}];
const squads=[{name:"A new connection",line:"I’d explore it on my own."},{name:"My duo",line:"Two people. One team."},{name:"My crew",line:"The whole squad is coming."}];
export function AssembleMission({window}:{window:string}){
 const [step,setStep]=useState(0),[role,setRole]=useState(""),[squad,setSquad]=useState(""),[alias,setAlias]=useState("");
 const heading=useRef<HTMLHeadingElement>(null);
 const go=(next:number)=>{setStep(next);requestAnimationFrame(()=>heading.current?.focus());};
 const title=["Who will you become?","Who’s on your team?","Your mission profile."][step];
 return <main className={styles.page}>
  <div className={styles.wrap}>
   <nav className={styles.nav} aria-label="Breadcrumb"><Link href="/events/assemble">← Back to ASSEMBLE</Link><span>Planet Infinity / Initiative 01</span></nav>
   <header className={styles.header}><p>An Avengers-inspired experience</p><h1>ASSEMBLE</h1><div className={styles.preview}>Interactive concept preview · Booking not open</div></header>
   <ol className={styles.steps} aria-label="Mission progress">{["Your identity","Your squad","Mission briefing"].map((name,i)=><li key={name} aria-current={i===step?"step":undefined} data-active={i<=step}><span>0{i+1}</span>{name}</li>)}</ol>
   <div className={styles.layout}>
    <section className={styles.panel} aria-labelledby="mission-step">
     <p className={styles.eyebrow}>Step 0{step+1} / 03</p><h2 id="mission-step" ref={heading} tabIndex={-1}>{title}</h2>
     {step===0?<><p className={styles.lead}>Not a costume assignment. Just the energy you’d bring to the team.</p><fieldset className={styles.options}><legend>Choose your hero energy</legend>{roles.map(item=><label key={item.name} data-selected={role===item.name}><input type="radio" name="role" value={item.name} checked={role===item.name} onChange={()=>setRole(item.name)}/><span className={styles.symbol} aria-hidden="true">{item.symbol}</span><span><strong>{item.name}</strong><small>{item.line}</small></span></label>)}</fieldset><label className={styles.alias}>Your hero alias <span>(optional)</span><input value={alias} onChange={e=>setAlias(e.target.value)} maxLength={40} placeholder="A name for your alter ego" autoComplete="off"/></label><button className={styles.primary} type="button" disabled={!role} onClick={()=>go(1)}>Meet your squad <span aria-hidden="true">→</span></button></>:null}
     {step===1?<><p className={styles.lead}>Every team begins somewhere. How would you arrive?</p><fieldset className={`${styles.options} ${styles.squads}`}><legend>Choose your squad</legend>{squads.map(item=><label key={item.name} data-selected={squad===item.name}><input type="radio" name="squad" value={item.name} checked={squad===item.name} onChange={()=>setSquad(item.name)}/><span><strong>{item.name}</strong><small>{item.line}</small></span></label>)}</fieldset><div className={styles.buttons}><button className={styles.back} type="button" onClick={()=>go(0)}>Back</button><button className={styles.primary} disabled={!squad} type="button" onClick={()=>go(2)}>Open mission briefing <span aria-hidden="true">→</span></button></div></>:null}
     {step===2?<><p className={styles.lead}>Different stories. One team. Here’s the beginning of yours.</p><div className={styles.pass}><div><span>ASSEMBLE / Mission profile</span><strong>{alias.trim()||"Your next chapter"}</strong><p>{role} · {squad}</p></div><span className={styles.stamp}>CONCEPT<br/>PREVIEW</span></div><div className={styles.status} role="status"><strong>Your profile is a preview—not a booking.</strong><p>No place has been reserved and nothing has been submitted. These choices stay on this screen only. Dates, ticket prices, activities and entry requirements will be confirmed before bookings open.</p></div><div className={styles.buttons}><button className={styles.back} type="button" onClick={()=>go(0)}>Edit profile</button><Link className={styles.primary} href="/contact">Ask about ASSEMBLE <span aria-hidden="true">→</span></Link></div></>:null}
    </section>
    <aside className={styles.summary}><p className={styles.eyebrow}>The initiative</p><h2>The next team<br/>is us.</h2><p>An independent, Avengers-inspired community concept. The spirit of assembling a team, reimagined for our people.</p><dl><div><dt>Your energy</dt><dd>{role||"Waiting for your choice"}</dd></div><div><dt>Your squad</dt><dd>{squad||"Your story starts here"}</dd></div><div><dt>Planned window</dt><dd>{window} · Provisional</dd></div><div><dt>Venue & tickets</dt><dd>To be announced</dd></div></dl><p className={styles.note}>No payment is collected in this preview.</p></aside>
   </div>
   <p className={styles.footer}>Fan-inspired. Not affiliated with Marvel or Disney. Final event details are still in development.</p>
  </div>
 </main>;
}
