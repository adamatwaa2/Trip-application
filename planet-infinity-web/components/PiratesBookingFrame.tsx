import Link from "next/link";
import type { ReactNode } from "react";
import type { UpcomingWorld } from "@/content/upcoming-worlds";
import { PirateMark } from "./PiratesChart";
import { piratesFont } from "./pirates-font";
import styles from "./PiratesExperience.module.css";

export function PiratesBookingFrame({ children }: { children: ReactNode }) {
  return <div className={`${styles.page} ${styles.booking} ${piratesFont.variable}`} data-experience="pirates-booking"><div className={styles.wrap}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/trips">Travel</Link><span>/</span><Link href="/trips/pirates-red-sea">Pirates of the Red Sea</Link><span>/</span><span>Come aboard</span></nav>
    <div className={styles.bookingBrand}><img src="/media/pirates/pirates-original-parchment-logo.webp" alt="Pirates of the Red Sea" width={738} height={150}/></div>
    {children}
    <p className={styles.bookingFoot}><PirateMark kind="wheel"/>A Planet Infinity voyage <span>·</span> <Link href="/trips/pirates-red-sea">Back to the adventure</Link></p>
  </div></div>;
}

export function PiratesBookingSoon({ world }: { world: UpcomingWorld }) {
  return <PiratesBookingFrame><div className={styles.bookingSoon}><PirateMark kind="anchor"/><p className={styles.kicker}>The crew manifest / Not open for booking</p><h1>Good things<br/>are <em>on the horizon.</em></h1><p>We’re preparing the boat, the route and the story. The voyage is planned for {world.window}; the final dates, price and programme are still to come.</p><div className={styles.bookingStatus}><span>Destination<strong>{world.location}</strong></span><span>Planned window<strong>{world.window} · Provisional</strong></span><span>Registration<strong>Not open yet</strong></span></div><Link className={styles.primary} href="/contact?experience=pirates-red-sea">Ask about the voyage <span aria-hidden="true">↗</span></Link><p className={styles.note}>No reservation or payment is collected here. We’ll share the confirmed details before registration opens.</p></div></PiratesBookingFrame>;
}
