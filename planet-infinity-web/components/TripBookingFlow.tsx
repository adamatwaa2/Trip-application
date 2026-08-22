"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  bookingSteps,
  STEP_LABELS,
  type BookingStep,
  type Trip,
} from "@/content/trips";
import { BookingConfirmation } from "./BookingConfirmation";
import { Button } from "./Button";
import { SeatSelection } from "./SeatSelection";
import { TripSelection, type SelectionState } from "./TripSelection";

/**
 * Front-end booking flow. No backend, no persistence, no payment, no
 * submission of any kind — the final step renders a confirmation state
 * locally and nothing leaves the browser.
 *
 * The steps come from bookingSteps(trip), which is the single place the four
 * configurations are resolved:
 *
 *   selection off · seats off  →  details → guest → review → confirmation
 *   selection on  · seats off  →  details → selection → guest → review → …
 *   selection off · seats on   →  details → seats → guest → review → …
 *   selection on  · seats on   →  details → selection → seats → guest → …
 *
 * A step that does not apply is never rendered and never counted.
 */
export function TripBookingFlow({ trip }: { trip: Trip }) {
  const steps = useMemo(() => bookingSteps(trip), [trip]);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);

  const [selection, setSelection] = useState<SelectionState>({});
  const [seat, setSeat] = useState<number | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [agreed, setAgreed] = useState(false);

  const step = steps[stepIndex];

  /** Chosen labels, in the order the trip defines its groups. */
  const selectionLabels = useMemo(() => {
    if (!trip.tripSelectionEnabled || !trip.optionGroups) return [];
    return trip.optionGroups
      .map((group) => {
        const choice = group.choices.find((c) => c.id === selection[group.id]);
        return choice ? `${group.label}: ${choice.label}` : null;
      })
      .filter((label): label is string => label !== null);
  }, [trip, selection]);

  /** Base price plus any selected deltas. Undefined when no price is set. */
  const total = useMemo(() => {
    if (trip.priceEgp === undefined) return undefined;
    let sum = trip.priceEgp;
    trip.optionGroups?.forEach((group) => {
      const choice = group.choices.find((c) => c.id === selection[group.id]);
      if (choice?.priceEgp !== undefined) sum = choice.priceEgp;
      if (choice?.priceDeltaEgp) sum += choice.priceDeltaEgp;
    });
    return sum * (Number(guestCount) || 1);
  }, [trip, selection, guestCount]);

  function canContinue(current: BookingStep): boolean {
    if (current === "selection") {
      const required = (trip.optionGroups ?? []).filter((g) => g.required !== false);
      return required.every((g) => Boolean(selection[g.id]));
    }
    if (current === "seats") return seat !== null;
    if (current === "guest") {
      return guestName.trim() !== "" && guestEmail.trim() !== "" && agreed;
    }
    return true;
  }

  if (done) {
    return (
      <BookingConfirmation
        details={{
          tripTitle: trip.title,
          selections: selectionLabels,
          seat: trip.seatBookingEnabled ? seat : undefined,
          guestName,
          guestEmail,
          guestPhone,
          guestCount: Number(guestCount) || 1,
          totalEgp: total,
          mode: trip.bookingMode,
        }}
      />
    );
  }

  return (
    <div className="pi-flow">
      <ol className="pi-flow__steps">
        {steps.map((s, index) => (
          <li
            key={s}
            className={[
              "pi-flow__step",
              index === stepIndex ? "pi-flow__step--current" : null,
              index < stepIndex ? "pi-flow__step--done" : null,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-current={index === stepIndex ? "step" : undefined}
          >
            <span className="pi-flow__step-num">{index + 1}</span>
            {STEP_LABELS[s]}
          </li>
        ))}
      </ol>

      <div className="pi-flow__panel">
        {step === "selection" && trip.optionGroups ? (
          <>
            <h2 className="pi-flow__title">{STEP_LABELS.selection}</h2>
            <TripSelection
              groups={trip.optionGroups}
              value={selection}
              onChange={(groupId, choiceId) =>
                setSelection((prev) => ({ ...prev, [groupId]: choiceId }))
              }
            />
          </>
        ) : null}

        {step === "seats" && trip.seat ? (
          <>
            <h2 className="pi-flow__title">{STEP_LABELS.seats}</h2>
            <p className="pi-flow__hint">
              Your seat applies to both the outbound and return journey unless
              we confirm otherwise.
            </p>
            <SeatSelection config={trip.seat} selected={seat} onSelect={setSeat} />
            <p className="pi-flow__selected">
              {seat === null ? "No seat picked yet — tap one above" : `Seat ${seat} selected`}
            </p>
          </>
        ) : null}

        {step === "guest" ? (
          <>
            <h2 className="pi-flow__title">{STEP_LABELS.guest}</h2>
            <label htmlFor="guestName">Full name</label>
            <input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />

            <label htmlFor="guestEmail">Email</label>
            <input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />

            <label htmlFor="guestPhone">
              Mobile / WhatsApp <span className="opt">(optional)</span>
            </label>
            <input
              id="guestPhone"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
            />

            <label htmlFor="guestCount">Number of guests</label>
            <input
              id="guestCount"
              type="number"
              min="1"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
            />

            <div className="agree-row">
              <input
                id="agreeTerms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="agreeTerms">
                I have read and agree to the Booking Terms &amp; Guest Policies
                <span className="placeholder-note">
                  The policy pages are not published yet.
                </span>
              </label>
            </div>
          </>
        ) : null}

        {step === "review" ? (
          <>
            <h2 className="pi-flow__title">{STEP_LABELS.review}</h2>
            <dl className="pi-review">
              <div>
                <dt>Trip</dt>
                <dd>{trip.title}</dd>
              </div>
              {selectionLabels.length > 0 ? (
                <div>
                  <dt>Your choices</dt>
                  <dd>{selectionLabels.join(" · ")}</dd>
                </div>
              ) : null}
              {trip.seatBookingEnabled ? (
                <div>
                  <dt>Seat</dt>
                  <dd>{seat === null ? "—" : `Seat ${seat}`}</dd>
                </div>
              ) : null}
              <div>
                <dt>Guest</dt>
                <dd>{guestName || "—"}</dd>
              </div>
              <div>
                <dt>Guests</dt>
                <dd>{guestCount}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  {guestEmail || "—"}
                  {guestPhone ? ` · ${guestPhone}` : ""}
                </dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>
                  {total !== undefined
                    ? `${total.toLocaleString("en-US")} EGP`
                    : "Price not set"}
                </dd>
              </div>
            </dl>
            <p className="pi-flow__hint">
              Sending this does not confirm anything. Nothing is charged, and
              nothing is saved — this is a front-end preview.
            </p>
          </>
        ) : null}
      </div>

      <div className="pi-flow__actions">
        {stepIndex > 0 ? (
          <Button variant="secondary" onClick={() => setStepIndex((i) => i - 1)}>
            Back
          </Button>
        ) : (
          <Link href={`/trips/${trip.slug}`} className="pi-btn pi-btn--secondary">
            Back to trip
          </Link>
        )}

        {stepIndex < steps.length - 1 ? (
          <Button
            disabled={!canContinue(step)}
            onClick={() => setStepIndex((i) => i + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button disabled={!canContinue(step)} onClick={() => setDone(true)}>
            {trip.bookingMode === "booking" ? "Book now" : "Request to book"}
          </Button>
        )}
      </div>
    </div>
  );
}
