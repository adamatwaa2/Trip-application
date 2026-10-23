"use client";
import { useEffect, useState } from "react";
import { eventPriceAt, type EventPriceSchedule } from "@/lib/scheduled-event-price";
export function useSpookyPrice(price: number, schedule?: EventPriceSchedule) {
  const [now, setNow] = useState<number | undefined>();
  const deadline = schedule?.changesAt;
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, [deadline]);
  return now === undefined ? price : eventPriceAt(price, { priceSchedule: schedule }, now) ?? price;
}
export function SpookyHausPrice({ price, schedule }: { price: number; schedule?: EventPriceSchedule }) {
  const current = useSpookyPrice(price, schedule);
  const early = schedule ? current === schedule.before : false;
  return <div className="sh-price" aria-live="polite">
    <span className="sh-kicker">{early ? "Early bird admission" : "Admission"}</span>
    <p className="sh-price-value">{current.toLocaleString("en-EG")} <span>EGP / guest</span></p>
    {schedule ? <p className="sh-price-note">{early ? `EGP ${schedule.after.toLocaleString("en-EG")} from ` : "Early bird has closed. Standard admission applies from "}<time dateTime={schedule.changesAt}>{new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(schedule.changesAt))} (Cairo)</time>.</p> : null}
  </div>;
}
