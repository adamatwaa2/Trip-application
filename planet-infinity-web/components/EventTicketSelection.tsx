"use client";

import type { TicketOption } from "@/content/events";
import { AvailabilityPill } from "./AvailabilityPill";
import { Price } from "./Price";

type EventTicketSelectionProps = {
  options: TicketOption[];
  value: string | null;
  onChange: (optionId: string) => void;
};

/**
 * Ticket / option selection for an event.
 *
 * Intentionally SEPARATE from TripSelection. Trips choose dates, packages and
 * editions; events choose ticket types and tiers. Merging them would produce
 * one component full of conditionals that neither product owns.
 *
 * Renders only the options the event actually defines. Nothing is assumed:
 * an event with no ticket options never reaches this component at all.
 */
export function EventTicketSelection({
  options,
  value,
  onChange,
}: EventTicketSelectionProps) {
  return (
    <div className="pi-tickets">
      {options.map((option) => {
        const checked = value === option.id;
        return (
          <label
            key={option.id}
            className={[
              "pi-ticket",
              checked ? "pi-ticket--checked" : null,
              option.soldOut ? "pi-ticket--soldout" : null,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <input
              type="radio"
              name="ticket"
              value={option.id}
              checked={checked}
              disabled={option.soldOut}
              onChange={() => onChange(option.id)}
            />
            <span className="pi-ticket__body">
              <span className="pi-ticket__label">{option.label}</span>
              {option.detail ? (
                <span className="pi-ticket__detail">{option.detail}</span>
              ) : null}
              {option.availableQuantity !== undefined ? (
                <span className="pi-ticket__remaining">
                  {option.availableQuantity} available
                </span>
              ) : null}
            </span>
            <span className="pi-ticket__meta">
              {option.soldOut ? (
                <AvailabilityPill state="soldOut" />
              ) : (
                <>
                  <Price egp={option.priceEgp} placeholderId="ticketPrice" />
                  <AvailabilityPill state={option.availability} />
                </>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
