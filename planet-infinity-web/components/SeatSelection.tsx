"use client";

import type { SeatConfig } from "@/content/trips";

export type SeatState = "available" | "selected" | "taken" | "unavailable";

type SeatSelectionProps = {
  config: SeatConfig;
  selected: number[];
  onToggle: (seat: number) => void;
};

/**
 * Reusable, trip-aware seat map.
 *
 * IT IS NEVER RENDERED UNLESS THE TRIP SETS seatBookingEnabled. Seat booking
 * is rare; the flow decides whether this step exists at all, and this
 * component never assumes it does.
 *
 * Geometry comes from the trip's SeatLayout, so a different vehicle is a data
 * change, not a code change. Taken seats stay quiet grey — never red.
 */
export function SeatSelection({ config, selected, onToggle }: SeatSelectionProps) {
  const taken = config.taken ?? [];
  const unavailable = config.unavailable ?? [];

  function stateOf(seat: number): SeatState {
    if (taken.includes(seat)) return "taken";
    if (unavailable.includes(seat)) return "unavailable";
    if (selected.includes(seat)) return "selected";
    return "available";
  }

  function renderSeat(seat: number) {
    const state = stateOf(seat);
    const locked = state === "taken" || state === "unavailable";

    return (
      <button
        key={seat}
        type="button"
        className={`pi-seat pi-seat--${state}`}
        aria-pressed={state === "selected"}
        aria-disabled={locked}
        aria-label={
          locked
            ? `Seat ${seat}, ${state === "taken" ? "already taken" : "not available"}`
            : `Seat ${seat}, available`
        }
        onClick={() => {
          if (!locked) onToggle(seat);
        }}
      >
        <span className="pi-seat__num">{seat}</span>
      </button>
    );
  }

  return (
    <div className="pi-seatmap">
      <p className="pi-seatmap__label">▲ Front of the vehicle</p>

      {config.layout.rows.map((row, index) => (
        <div
          key={index}
          className={`pi-seatmap__row${row.contiguous ? " pi-seatmap__row--contiguous" : ""}`}
        >
          <div className="pi-seatmap__group">
            {row.left.map((seat) =>
              seat === "driver" ? (
                <div key="driver" className="pi-seat pi-seat--driver">
                  <span>Driver</span>
                </div>
              ) : (
                renderSeat(seat)
              )
            )}
          </div>
          {row.right.length > 0 ? (
            <div className="pi-seatmap__group">{row.right.map(renderSeat)}</div>
          ) : null}
        </div>
      ))}

      <p className="pi-seatmap__label pi-seatmap__label--bottom">
        Back of the vehicle ▼
      </p>

      <div className="pi-seatmap__legend">
        <span><i className="pi-dot pi-dot--driver" /> Driver</span>
        <span><i className="pi-dot pi-dot--available" /> Available</span>
        <span><i className="pi-dot pi-dot--selected" /> Selected</span>
        <span><i className="pi-dot pi-dot--taken" /> Taken</span>
        <span><i className="pi-dot pi-dot--unavailable" /> Unavailable</span>
      </div>

      <p className="pi-seatmap__vehicle">{config.layout.label}</p>
    </div>
  );
}
