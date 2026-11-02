"use client";

import { useState } from "react";
import styles from "./PiratesExperience.module.css";

export function PirateMark({kind}:{kind:"compass"|"wheel"|"anchor"|"chest"}) {
  return <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind==="compass"?<><circle cx="50" cy="50" r="33"/><circle cx="50" cy="50" r="38" strokeDasharray="1 5"/><path d="M50 4V15M50 85V96M4 50H15M85 50H96M18 18L24 24M76 76L82 82M18 82L24 76M76 24L82 18M50 18L58 42L82 50L58 58L50 82L42 58L18 50L42 42Z"/><path d="M50 25V50L43 43ZM75 50H50L57 43ZM50 75V50L57 57ZM25 50H50L43 57Z" fill="currentColor"/><circle cx="50" cy="50" r="3"/></>:null}
    {kind==="wheel"?<><circle cx="50" cy="50" r="27"/><circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="7"/>{[0,45,90,135,180,225,270,315].map(angle=><g key={angle} transform={`rotate(${angle} 50 50)`}><path d="M50 43V13"/><path d="M47 13V7Q50 3 53 7V13Z"/></g>)}</>:null}
    {kind==="anchor"?<><circle cx="50" cy="19" r="8"/><path d="M50 27V86M30 39H70M18 56Q19 81 50 86Q81 81 82 56M18 56L12 69M18 56L30 65M82 56L88 69M82 56L70 65M43 82L50 90L57 82"/></>:null}
    {kind==="chest"?<><path d="M18 43Q18 22 36 22H67Q82 22 82 43V76H18ZM18 45H82M30 24V76M70 23V76M18 68H82M36 22Q50 26 50 43"/><path d="M45 43H57V57H45Z"/><circle cx="51" cy="49" r="1"/></>:null}
  </svg>;
}
const chapters=[
  {number:"01",name:"The harbour",kind:"anchor" as const,title:"Every stranger is a future crewmate.",copy:"Leave the shore behind. Meet the crew, choose your pirate name and step into the story. The first clue is only the beginning.",clue:"A voyage starts with the people beside you."},
  {number:"02",name:"Open water",kind:"wheel" as const,title:"Trade your routine for the horizon.",copy:"A boat, the Red Sea breeze and the feeling of heading somewhere together. Our imagined sailing chapter gives the story room to unfold.",clue:"Where the horizon opens, so does the story."},
  {number:"03",name:"The hunt",kind:"compass" as const,title:"The map is only half the answer.",copy:"Piece together cryptic clues and follow a playful fictional mystery with your crew. A good theory is better when someone else helps finish it.",clue:"No one finds the way alone."},
  {number:"04",name:"X marks the story",kind:"chest" as const,title:"Some treasure comes home with you.",copy:"The imagined finale brings the crew together for the reveal. A mystery solved, new faces turned into friends, and a story that belongs to all of you.",clue:"The real find? The crew you became."},
];
export function PiratesChart(){
  const [active,setActive]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const chapter=chapters[active];
  return <div className={styles.chart}>
    <div className={styles.map}>
      <span className={styles.mapLabel}>The Red Sea / An imagined voyage</span>
      <svg className={styles.mapLines} viewBox="0 0 800 430" fill="none" aria-hidden="true"><path className={styles.coast} d="M0 0H188L173 38L193 60L160 93L168 123L131 153L145 180L116 217L130 240L99 265L104 307L67 328L73 364L36 391L42 430H0ZM800 0H681L695 30L668 58L683 91L651 124L669 147L640 185L657 214L628 239L637 280L602 310L614 338L581 372L593 398L573 430H800Z"/><path d="M153 0L138 47L149 67L124 102L129 130L101 163L112 186L84 223L92 247L64 279L68 307L36 338L44 374L13 403M722 0L732 41L707 67L720 100L692 135L704 162L676 200L692 224L664 254L675 292L643 323L654 354L624 387L636 430" stroke="currentColor" opacity=".18"/><path className={styles.route} d="M193 323C240 326 250 253 332 264S454 168 512 178S602 91 605 75"/><path d="M415 305L435 291L449 303L440 325L418 322ZM300 94L323 82L335 101L323 118L304 111Z" fill="currentColor" opacity=".1"/><text x="62" y="85" transform="rotate(-68 62 85)">EGYPT</text><text x="410" y="364" transform="rotate(-61 410 364)">RED SEA</text></svg>
      <div className={styles.mapCompass}><PirateMark kind="compass"/><span>N</span></div>
      <div className={styles.mapPoints} role="tablist" aria-label="Imagined voyage chapters">{chapters.map((item,index)=><button key={item.number} id={`pirate-tab-${index}`} type="button" role="tab" aria-selected={active===index} aria-controls="pirate-chapter" tabIndex={active===index?0:-1} className={`${styles.mapPoint} ${styles[`point${index}`]}`} onClick={()=>{setActive(index);setRevealed(false);}} onKeyDown={event=>{let next=index;if(event.key==="ArrowRight"||event.key==="ArrowDown")next=(index+1)%4;else if(event.key==="ArrowLeft"||event.key==="ArrowUp")next=(index+3)%4;else if(event.key==="Home")next=0;else if(event.key==="End")next=3;else return;event.preventDefault();setActive(next);setRevealed(false);document.getElementById(`pirate-tab-${next}`)?.focus();}}><span className={styles.pointCircle}>{index===3?<span className={styles.xMark}>×</span>:item.number}</span><span>{item.name}</span></button>)}</div>
      <span className={styles.mapCaption}>A story map, not a sailing route.</span>
    </div>
    <div className={styles.chapter} id="pirate-chapter" role="tabpanel" aria-labelledby={`pirate-tab-${active}`} tabIndex={0}><div className={styles.chapterTop}><span>Chapter {chapter.number} / 04</span><PirateMark kind={chapter.kind}/></div><h3>{chapter.title}</h3><p>{chapter.copy}</p><button type="button" className={styles.clueButton} aria-expanded={revealed} onClick={()=>setRevealed(value=>!value)}>{revealed?"Fold the note":"Open the captain’s note"}<span aria-hidden="true">{revealed?"−":"+"}</span></button>{revealed?<p className={styles.clue} role="status">“{chapter.clue}”</p>:null}<p className={styles.note}>Creative outline · Activities and programme are not confirmed.</p></div>
  </div>;
}
