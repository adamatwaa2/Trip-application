"use client";

import { useMemo, useState, useTransition } from "react";
import { seatConfigVehicles, seatNumbers, type SeatConfig } from "@/content/trips";
import { choosePaidBookingSeats } from "@/app/actions/requests";
import { SeatSelection } from "./SeatSelection";

export function PaidSeatSelection({ paymentToken, guestCount, config, currentSeats, currentVehicleId }: { paymentToken: string; guestCount: number; config: SeatConfig; currentSeats: number[]; currentVehicleId?: string | null }) {
  const vehicles = useMemo(() => seatConfigVehicles(config), [config]);
  const [seats, setSeats] = useState(currentSeats);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const complete = seats.length === guestCount;
  const bookedVehicle = vehicles.find((vehicle) => vehicle.id === currentVehicleId);
  const nextAvailableVehicle = vehicles.find((vehicle) => {
    const unavailable = vehicle.unavailable ?? config.unavailable ?? [];
    const freeSeats = seatNumbers(vehicle.layout).filter((seat) => !unavailable.includes(seat) && !(vehicle.taken ?? []).includes(seat));
    return freeSeats.length >= guestCount;
  });
  const vehicle = bookedVehicle ?? nextAvailableVehicle ?? {
    id: `hiace-${vehicles.length + 1}`,
    label: `Hiace ${vehicles.length + 1}`,
    layout: vehicles[0]?.layout ?? config.layout,
    unavailable: Array.from(new Set([1, ...(vehicles[0]?.unavailable ?? config.unavailable ?? [])])),
  };
  const vehicleId = vehicle.id;
  const vehicleConfig: SeatConfig = {
    layout: vehicle.layout,
    unavailable: vehicle.unavailable ?? config.unavailable,
    taken: vehicle.taken ?? [],
  };
  const isNewVehicle = !vehicles.some((item) => item.id === vehicle.id);
  return <div>
    <h2>Choose your seat{guestCount > 1 ? "s" : ""}</h2>
    <p className="pi-flow__hint">Your booking is confirmed. You have been placed in a <strong>Hiace</strong>{isNewVehicle ? " that has just opened for this departure" : ""}. Choose {guestCount} available seat{guestCount > 1 ? "s" : ""} now.</p>
    <SeatSelection config={vehicleConfig} selected={seats} onToggle={(seat) => setSeats((current) => current.includes(seat) ? current.filter((value) => value !== seat) : current.length < guestCount ? [...current, seat].sort((a,b) => a-b) : current)} />
    <button className="pi-btn" type="button" disabled={!complete || pending} onClick={() => startTransition(async () => { const result = await choosePaidBookingSeats({ paymentToken, vehicleId, seats }); setMessage(result.ok ? "Your seat selection is saved." : result.error); })}>{pending ? "Saving…" : currentSeats.length ? "Update seat selection" : "Save seat selection"}</button>
    {message ? <p className={message.includes("saved") ? "pi-flow__success" : "pi-flow__error"}>{message}</p> : null}
  </div>;
}
