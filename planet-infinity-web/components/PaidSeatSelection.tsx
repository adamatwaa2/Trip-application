"use client";

import { useState, useTransition } from "react";
import type { SeatConfig } from "@/content/trips";
import { choosePaidBookingSeats } from "@/app/actions/requests";
import { SeatSelection } from "./SeatSelection";

export function PaidSeatSelection({ paymentToken, guestCount, config, currentSeats }: { paymentToken: string; guestCount: number; config: SeatConfig; currentSeats: number[] }) {
  const [seats, setSeats] = useState(currentSeats);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const complete = seats.length === guestCount;
  return <div>
    <h2>Choose your seat{guestCount > 1 ? "s" : ""}</h2>
    <p className="pi-flow__hint">Your payment is recorded. Choose {guestCount} available seat{guestCount > 1 ? "s" : ""} now.</p>
    <SeatSelection config={config} selected={seats} onToggle={(seat) => setSeats((current) => current.includes(seat) ? current.filter((value) => value !== seat) : current.length < guestCount ? [...current, seat].sort((a,b) => a-b) : current)} />
    <button className="pi-btn" type="button" disabled={!complete || pending} onClick={() => startTransition(async () => { const result = await choosePaidBookingSeats({ paymentToken, seats }); setMessage(result.ok ? "Your seat selection is saved." : result.error); })}>{pending ? "Saving…" : currentSeats.length ? "Update seat selection" : "Save seat selection"}</button>
    {message ? <p className={message.includes("saved") ? "pi-flow__success" : "pi-flow__error"}>{message}</p> : null}
  </div>;
}
