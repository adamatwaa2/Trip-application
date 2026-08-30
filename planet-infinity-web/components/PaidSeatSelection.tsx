"use client";

import { useMemo, useState, useTransition } from "react";
import { seatConfigVehicles, type SeatConfig } from "@/content/trips";
import { choosePaidBookingSeats } from "@/app/actions/requests";
import { SeatSelection } from "./SeatSelection";

export function PaidSeatSelection({ paymentToken, guestCount, config, currentSeats, currentVehicleId }: { paymentToken: string; guestCount: number; config: SeatConfig; currentSeats: number[]; currentVehicleId?: string | null }) {
  const vehicles = useMemo(() => seatConfigVehicles(config), [config]);
  const firstVehicleId = vehicles[0]?.id ?? "hiace-1";
  const [vehicleId, setVehicleId] = useState(() => vehicles.some((vehicle) => vehicle.id === currentVehicleId) ? currentVehicleId! : firstVehicleId);
  const [seats, setSeats] = useState(currentSeats);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const complete = seats.length === guestCount;
  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? vehicles[0] ?? {
    id: "hiace-1",
    label: "Hiace 1",
    layout: config.layout,
    unavailable: config.unavailable,
  };
  const vehicleConfig: SeatConfig = {
    layout: vehicle.layout,
    unavailable: vehicle.unavailable ?? config.unavailable,
    taken: vehicle.taken ?? [],
  };

  return <div>
    <h2>Choose your seat{guestCount > 1 ? "s" : ""}</h2>
    <p className="pi-flow__hint">Your booking is confirmed. Choose {guestCount} available seat{guestCount > 1 ? "s" : ""} now.</p>
    {vehicles.length > 1 ? (
      <label className="pi-seat-vehicle-picker">
        Vehicle / Hiace
        <select value={vehicleId} onChange={(event) => { setVehicleId(event.target.value); setSeats([]); setMessage(null); }}>
          {vehicles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
    ) : null}
    <SeatSelection config={vehicleConfig} selected={seats} onToggle={(seat) => setSeats((current) => current.includes(seat) ? current.filter((value) => value !== seat) : current.length < guestCount ? [...current, seat].sort((a,b) => a-b) : current)} />
    <button className="pi-btn" type="button" disabled={!complete || pending} onClick={() => startTransition(async () => { const result = await choosePaidBookingSeats({ paymentToken, vehicleId, seats }); setMessage(result.ok ? "Your seat selection is saved." : result.error); })}>{pending ? "Saving…" : currentSeats.length ? "Update seat selection" : "Save seat selection"}</button>
    {message ? <p className={message.includes("saved") ? "pi-flow__success" : "pi-flow__error"}>{message}</p> : null}
  </div>;
}
