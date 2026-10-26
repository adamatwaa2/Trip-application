import Link from "next/link";
import type {UpcomingWorld} from "@/content/upcoming-worlds";
import {CatalogThemeFrame} from "./CatalogThemeFrame";
import styles from "./DuneExperience.module.css";

function DuneWordmark(){
 return <svg viewBox="0 0 660 125" fill="none" aria-hidden="true"><path d="M15 12H45A50 50 0 0 1 45 112H15M185 12V65A47 47 0 0 0 279 65V12M365 112V12L459 112V12M565 12H650M565 62H635M565 112H650" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
export function DuneExperience({world}:{world:UpcomingWorld}){
 const poster="/media/dune/dune-opening-v1.jpg";
 return <CatalogThemeFrame kind="trip" theme={world.theme}><main className={styles.page} data-experience="dune">
  <section className={styles.opening} aria-label="DUNE desert atmosphere"><img className={styles.openingBlur} src={poster} alt="" aria-hidden="true"/><img className={styles.openingImage} src={poster} width={560} height={582} fetchPriority="high" alt="Dune-inspired desert artwork with sunlit sand dunes"/></section>
  <section className={styles.hero}><svg className={styles.landscape} viewBox="0 0 1400 640" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle cx="1090" cy="135" r="62"/><path d="M-100 640Q270 20 720 440T1500 290M-100 700Q270 100 720 490T1500 345M-100 760Q270 180 720 540T1500 400"/></svg><div className={styles.wrap}>
   <nav className={styles.crumb} aria-label="Breadcrumb"><Link href="/trips">Travel</Link><span>/</span><span>DUNE · Siwa</span></nav>
   <p className={styles.eyebrow}>Planet Infinity / A desert world in the making</p>
   <h1 aria-label="DUNE"><span className={styles.srOnly}>DUNE</span><DuneWordmark/></h1>
   <p className={styles.destination}>S I W A</p><p className={styles.tagline}>Beyond the noise.<br/>Into the desert.</p>
   <div className={styles.meta}><span>{world.location}</span><span>{world.window} · Planned window</span><span>Trip / Theme</span></div>
  </div></section>
  <section className={`${styles.wrap} ${styles.story}`}><div><p className={styles.eyebrow}>01 / The atmosphere</p><h2>A different world.<br/>A slower rhythm.</h2></div><div><p>A Siwa journey imagined through the atmosphere of Dune: sculpted sand, warm copper light and the feeling of stepping beyond the everyday.</p><p>Not a film set. Our own desert story, shaped by the oasis and the people who share it.</p><ul>{world.mood.map(mood=><li key={mood}>{mood}</li>)}</ul></div></section>
  <section className={`${styles.wrap} ${styles.details}`} aria-labelledby="dune-journey"><div><p className={styles.eyebrow}>02 / The journey ahead</p><h2 id="dune-journey">The desert sets<br/>the pace.</h2><p>This experience is still being prepared. The final stay, activities and travel arrangements will be announced before registration opens.</p></div><aside><p className={styles.eyebrow}>Journey status / In development</p><dl><div><dt>Destination</dt><dd>Siwa, Egypt</dd></div><div><dt>Planned window</dt><dd>{world.window} · Provisional</dd></div><div><dt>Price & program</dt><dd>To be announced</dd></div><div><dt>Booking</dt><dd>Not open yet</dd></div></dl><p className={styles.small}>No confirmed departure, ticket or payment is available on this concept page.</p></aside></section>
  <p className={`${styles.wrap} ${styles.disclaimer}`}>An independent, Dune-inspired Planet Infinity concept. Not affiliated with the film studio or its creators.</p>
 </main></CatalogThemeFrame>;
}
