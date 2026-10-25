import Link from "next/link";
import type { UpcomingWorld } from "@/content/upcoming-worlds";
import { CatalogThemeFrame } from "./CatalogThemeFrame";
import { ExperienceIntroVideo } from "./ExperienceIntroVideo";
import styles from "./AssembleExperience.module.css";

export function AssembleMark() {
 return <svg viewBox="0 0 360 360" fill="none" aria-hidden="true"><circle cx="180" cy="180" r="146"/><circle cx="180" cy="180" r="132" strokeDasharray="230 40 90 25"/><path d="M95 263L176 78H215L253 263H213L203 213H151L130 263ZM164 180H197L185 124Z"/><path d="M143 213H275L252 190M275 213L252 236"/></svg>;
}

export function AssembleExperience({world}:{world:UpcomingWorld}) {
 return <CatalogThemeFrame kind="event" theme={world.theme}><main className={styles.page}>
  {world.video?<ExperienceIntroVideo src={world.video} label="ASSEMBLE opening video"/>:null}
  <section className={styles.hero}>
   <div className={styles.emblem}><AssembleMark/></div>
   <div className={styles.wrap}>
    <nav className={styles.crumb} aria-label="Breadcrumb"><Link href="/events">Events</Link><span>/</span><span>ASSEMBLE</span></nav>
    <p className={styles.kicker}>Planet Infinity presents · An Avengers-inspired experience</p>
    <h1>ASSEMBLE<span>The next team is us.</span></h1>
    <p className={styles.intro}>The old team left a legacy.<br/>Now it’s our turn to come together.</p>
    <div className={styles.actions}><Link className={styles.primary} href="/events/assemble/book">Send your interest request <span aria-hidden="true">→</span></Link><a className={styles.secondary} href="#the-mission">Discover the experience</a></div>
    <div className={styles.meta}><span><i/>Experience in development</span><span>{world.window} · Planned</span><span>Venue & tickets to be announced</span></div>
   </div>
  </section>
  <section className={`${styles.wrap} ${styles.briefing}`} id="the-mission">
   <div><p className={styles.kicker}>01 / The initiative</p><h2>Not another audience.<br/>A new team.</h2></div>
   <div><p>You know the feeling: different heroes, different stories, one moment that brings them together. ASSEMBLE takes that Avengers spirit and puts our community at the centre of it.</p><p>Come as the hero you love. Or imagine one of your own. The idea is a costume-led, cinematic gathering where you’re part of the story—not just watching it.</p><small>Concept direction. The final format, activities and costume guidelines are still being developed.</small></div>
  </section>
  <section className={`${styles.wrap} ${styles.chapters}`} aria-label="The experience concept">
   {[['01','Your identity','A familiar hero. An unexpected alter ego. A version of you nobody has met.'],['02','Your people','Bring your crew—or imagine finding your place in a new one.'],['03','One shared story','Cinematic atmosphere, music and a community brought together by the same world.']].map(([n,title,copy])=><article key={n}><span className={styles.number}>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}
  </section>
  <section className={`${styles.wrap} ${styles.callout}`}><div><p className={styles.kicker}>Your next chapter</p><h2>Every team starts<br/>with a first step.</h2><p>Choose your Avengers inspiration, tell us your group size and send your details directly to our team.</p></div><div><Link className={styles.primary} href="/events/assemble/book">Send your interest request <span aria-hidden="true">→</span></Link><p className={styles.fine}>You’ll receive an on-screen request reference after submission. This is an interest request, not a confirmed ticket. No payment is taken.</p></div></section>
  <p className={`${styles.wrap} ${styles.disclaimer}`}>An independent Planet Infinity fan-inspired concept. Not affiliated with or endorsed by Marvel or Disney.</p>
 </main></CatalogThemeFrame>;
}
