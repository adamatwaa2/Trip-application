"use client";

type EventQuantityProps = {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  /** Shown under the control when the ticket limits how many remain. */
  availableNote?: string;
};

/**
 * Quantity step. Only rendered for events whose configuration enables it —
 * an event is never assumed to allow more than one place, and one ticket is
 * never assumed to equal one guest.
 */
export function EventQuantity({
  value,
  min,
  max,
  onChange,
  availableNote,
}: EventQuantityProps) {
  return (
    <div className="pi-qty">
      <div className="pi-qty__control">
        <button
          type="button"
          className="pi-qty__btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Fewer tickets"
        >
          −
        </button>
        <span className="pi-qty__value" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="pi-qty__btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="More tickets"
        >
          +
        </button>
      </div>
      <p className="pi-qty__limits">
        {min === max
          ? `This ticket is sold in ${min} at a time.`
          : `Between ${min} and ${max} per booking.`}
        {availableNote ? ` ${availableNote}` : ""}
      </p>
    </div>
  );
}
