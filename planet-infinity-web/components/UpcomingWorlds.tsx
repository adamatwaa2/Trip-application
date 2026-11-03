import Link from "next/link";
import type { CSSProperties } from "react";
import { upcomingHref, type UpcomingWorld } from "@/content/upcoming-worlds";
import styles from "./UpcomingWorlds.module.css";
import {CatalogThemeFrame} from "./CatalogThemeFrame";
import {ExperienceIntroVideo} from "./ExperienceIntroVideo";
import {AssembleExperience} from "./AssembleExperience";
import {DuneExperience} from "./DuneWorldExperience";
import {ArenaExperience} from "./ArenaExperience";
import {PiratesExperience} from "./PiratesExperience";

function worldStyle(world:UpcomingWorld): CSSProperties {
 return {"--world-accent":world.accent,"--world-surface":world.surface,"--world-ink":world.ink} as CSSProperties;
}
function WorldArtwork({world}:{world:UpcomingWorld}) {
 if(world.slug==="pirates-red-sea")return <div className={`${styles.art} ${styles.piratesPreview}`} aria-hidden="true"><img src="/media/pirates/pirates-original-parchment-logo.webp" alt="" width={738} height={150}/><span>A boat. A crew. A story worth chasing.</span></div>;
 return <div className={styles.art} data-motif={world.motif} aria-hidden="true">
  {world.hero?<img className={styles.worldCover} src={world.hero} alt=""/>:null}
  {world.logo?<img className={styles.worldLogo} src={world.logo} alt=""/>:null}
  <svg viewBox="0 0 600 420" fill="none" preserveAspectRatio="xMidYMid slice">
   {world.motif==="sober"?<><path stroke="#ff753b" strokeWidth="10" d="M0 170h90l35-55 48 110 56-140 57 185 57-125 39 61 49-36h169"/><path stroke="#ff82bc" d="M0 275h600M0 289h600M0 309h600"/><circle cx="420" cy="175" r="115" strokeDasharray="5 9"/><circle cx="420" cy="175" r="135"/></>:null}
   {world.motif==="doom"?<><circle cx="300" cy="210" r="156"/><circle cx="300" cy="210" r="140" strokeDasharray="245 45 96 28"/><path d="M208 300L295 102H337L378 300H335L324 246H268L246 300ZM282 211H318L305 151ZM260 246H402L378 221M402 246L378 271"/></>:null}
   {world.motif==="flowers"?<>
    <path d="M0 32Q300 138 600 32" stroke="#ffe4ab"/>
    {["#d72d57","#ffaf31","#28a58b","#a563cb","#ffaf31","#d72d57"].map((color,i)=><g key={i} transform={"translate("+(32+i*96)+" "+(46+Math.min(i,5-i)*14)+")"}>
     <path d="M0 0h57v38l-7 7-7-6-7 6-7-6-7 6-7-6-7 6-8-7Z" fill={color} stroke="none"/>
     <path d="m14 20 7-7 7 7-7 7Zm16 0 7-7 7 7-7 7Z" fill="#37142f" stroke="none"/>
    </g>)}
    <path d="M190 210Q192 123 300 125Q408 123 410 210Q418 260 374 293L364 333Q300 372 236 333L226 293Q182 260 190 210Z" fill="#fff0cc" stroke="#ffbd59" strokeWidth="4"/>
    <path d="M285 272Q300 231 315 272Q300 285 285 272ZM252 308Q300 330 348 308" fill="#401632" stroke="#401632" strokeWidth="4"/>
    <path d="M270 311v16m20-12v17m20-17v17m20-21v16" stroke="#a73346"/>
    {[244,356].map(x=><g key={x} transform={"translate("+x+" 218)"}><circle r="34" fill="#762651" stroke="#d13854" strokeWidth="7"/><circle r="21" fill="#30142c" stroke="#f79039" strokeDasharray="2 5"/></g>)}
    {[[125,280],[182,142],[300,157],[418,142],[475,280]].map(([x,y],i)=><g key={x} transform={"translate("+x+" "+y+") scale("+(i===2?.47:1)+")"}>
     {Array.from({length:10},(_,j)=><ellipse key={j} cy="-23" rx="12" ry="19" transform={"rotate("+j*36+")"} fill={j%2?"#ff9d27":"#ee6628"} stroke="none"/>)}
     <circle r="11" fill="#a23442" stroke="#ffe191"/>
    </g>)}
    <path d="M220 278l14-10 14 10-14 10Zm132 0 14-10 14 10-14 10Z" fill="#218573" stroke="none"/>
   </>:null}
   {world.motif==="western"?<><circle cx="440" cy="105" r="53"/><path d="M70 315h460M95 286l82-89 67 51 79-92 115 130M185 280q-35-35-35-100h30q0 75 50 75t50-75h30q0 100-80 100z"/></>:null}
   {world.motif==="mask"?<><path d="M110 140Q205 90 300 140Q395 90 490 140L460 235Q405 300 335 235L300 215L265 235Q195 300 140 235Z"/><path d="M155 170Q205 140 250 180Q205 215 155 170ZM350 180Q395 140 445 170Q395 215 350 180ZM300 140V215M130 130L95 95M470 130L505 95"/><circle cx="300" cy="90" r="12"/></>:null}
   {world.motif==="sea"?<><circle cx="445" cy="125" r="62"/><path d="M-30 290Q120 190 280 290T650 280M-30 330Q120 230 280 330T650 320M-30 370Q120 270 280 370T650 360"/></>:null}
   {world.motif==="dunes"?<><circle cx="460" cy="100" r="45"/><path d="M-50 420Q130 60 370 260T700 150M-50 460Q170 110 400 310T700 220M-50 500Q170 160 400 360T700 270"/></>:null}
   {world.motif==="orbit"?<><circle cx="310" cy="220" r="130"/><ellipse cx="310" cy="220" rx="260" ry="75" transform="rotate(-30 310 220)"/><ellipse cx="310" cy="220" rx="260" ry="75" transform="rotate(30 310 220)"/><circle cx="488" cy="106" r="20"/></>:null}
   {world.motif==="clock"?<><circle cx="310" cy="210" r="150"/><circle cx="310" cy="210" r="130"/><path d="M310 70V210L370 155M310 60V85M460 210H435M310 360V335M160 210H185"/></>:null}
   {world.motif==="arena"?<><path d="M300 35L525 390H75L300 35ZM300 105L465 365H135L300 105Z"/><circle cx="300" cy="250" r="90"/><path d="M0 250H600M300 0V420"/></>:null}
   {world.motif==="temple"?<><path d="M100 350H500M120 120H480M140 100L300 50L460 100M150 135V330M225 135V330M375 135V330M450 135V330M100 370H500"/><circle cx="300" cy="200" r="48"/></>:null}
  </svg><span className={styles.artWord}>{world.title}</span>
 </div>;
}
export function UpcomingWorldGrid({worlds,title="Next on the horizon"}:{worlds:UpcomingWorld[];title?:string}) {
 if(!worlds.length)return null;
 return <section className={styles.list} aria-label="Upcoming experiences"><div className={styles.wrap}>
  <header className={styles.listHead}><div><p className={styles.eyebrow}>Upcoming · In development</p><h2>{title}</h2></div><p>Explore the next worlds. Bookings are not open yet.</p></header>
  <div className={title === "Upcoming Events" ? styles.eventList : styles.grid}>{worlds.map(world=><Link className={title === "Upcoming Events" ? styles.eventRow : styles.card} data-world={world.slug} style={worldStyle(world)} href={upcomingHref(world)} key={world.slug}>
   <WorldArtwork world={world}/><div className={styles.cardBody}><p className={styles.cardWindow}>{world.window}{world.window!=="Dates to be announced"?" · Planned":null}</p><h3>{world.title}</h3><p>{world.subtitle}</p><span className={styles.channels}>{world.channels.map(c=>c==="trips"?"Trip":c==="events"?"Event":"Theme").join(" · ")}</span><strong>Explore the concept <span aria-hidden="true">→</span></strong></div>
  </Link>)}</div>
 </div></section>;
}
export function UpcomingExperiencePage({world}:{world:UpcomingWorld}) {
 if(world.slug==="pirates-red-sea")return <PiratesExperience world={world}/>;
 if(world.slug==="doomsday")return <AssembleExperience world={world}/>;
 if(world.slug==="dune-siwa")return <DuneExperience world={world}/>;
 if(world.slug==="arena")return <ArenaExperience world={world}/>;
 const themedParty = ["noche-de-flores", "masquerade-party", "cowboy-night", "super-party"].includes(world.slug);
 const back=world.kind==="trip"?"/trips":"/events";
 return <CatalogThemeFrame kind={world.kind} theme={world.theme??{primaryColor:world.accent,secondaryColor:world.surface,surface:world.ink==="#0f1e28"||world.ink==="#3e2c1b"?"light":"dark",typography:"brand",background:"clean",finish:"matte"}}><main className={styles.page} data-world={world.slug} style={worldStyle(world)}>
  {world.video?<ExperienceIntroVideo key={world.video} src={world.video} poster={world.hero} label={`${world.title} opening video`}/>:null}
  <section className={styles.hero}><WorldArtwork world={world}/><div className={styles.heroCopy}>
   <nav aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href={back}>{world.kind==="trip"?"Travel":"Events"}</Link><span>/</span><span>{world.title}</span></nav>
   <p className={styles.heroStatus}>Planet Infinity · Upcoming experience</p><h1>{world.title}</h1><p className={styles.subtitle}>{world.subtitle}</p><p className={styles.tagline}>{world.tagline}</p>
   <div className={styles.heroMeta}><span>{world.location}</span><span>{world.window}{world.window!=="Dates to be announced"?" · Planned window":null}</span></div>
  </div></section>
  <section className={`${styles.wrap} ${styles.story}`}><div><p className={styles.eyebrow}>A world in the making</p><h2>{world.tagline}</h2><p>{world.description}</p><ul className={themedParty ? styles.program : styles.mood}>{world.mood.map((item, index)=><li key={item}>{themedParty ? <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span> : null}{item}</li>)}</ul></div>
   <aside className={styles.notice}><p className={styles.eyebrow}>Not open for booking</p><h2>The story comes first.<br/>The details come next.</h2><p>This is a preview of a future Planet Infinity experience, not a confirmed departure or a ticket on sale.</p><dl><div><dt>When</dt><dd>{world.window}{world.window!=="Dates to be announced"?" · provisional":null}</dd></div><div><dt>Price & program</dt><dd>To be announced</dd></div><div><dt>Experience</dt><dd>{world.channels.map(c=>c==="trips"?"Trip":c==="events"?"Event":"Theme").join(" · ")}</dd></div></dl>{world.slug==="noche-de-flores" ? <p><a href="/events/Noche-de-Flores.pdf">Download the event PDF</a></p> : null}<Link className={styles.contact} href="/contact">Ask about this experience</Link><p className={styles.small}>Final dates, inclusions, arrangements and any participation requirements will be shared before registration opens.</p></aside>
  </section>
 </main></CatalogThemeFrame>;
}

