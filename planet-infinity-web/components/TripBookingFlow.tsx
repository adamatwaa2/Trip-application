"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  bookingSteps,
  STEP_LABELS,
  type BookingStep,
  type Trip,
} from "@/content/trips";
import { BookingConfirmation } from "./BookingConfirmation";
import { Button } from "./Button";
import { TripSelection, type SelectionState } from "./TripSelection";
import { submitPublicRequest, submitPublicTripBooking } from "@/app/actions/requests";
import { PolicyAcceptance } from "./PolicyAcceptance";
import {
  bookingFormAnswersComplete,
  bookingOptionLabel,
  bookingOptionPrice,
  type BookingFormAnswer,
} from "@/lib/booking-form";
import { TripCustomQuestions } from "./TripCustomQuestions";
import { PaymentProofStep, type PaymentProofValue } from "./PaymentProofStep";

/**
 * Trip checkout flow. Direct trips create a booking immediately; the rare
 * application/request paths continue to use the request inbox.
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
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [customAnswers, setCustomAnswers] = useState<Record<string, BookingFormAnswer>>({});
  const [songRequest, setSongRequest] = useState("");
  const [paymentProof, setPaymentProof] = useState<PaymentProofValue | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [requestNumber, setRequestNumber] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const step = steps[stepIndex];
  const guestCountNumber = Math.max(1, Number(guestCount) || 1);

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
    const guests = Number(guestCount) || 1;
    return (sum + bookingOptionPrice(trip.bookingFormFields ?? [], customAnswers)) * guests;
  }, [trip, selection, guestCount, customAnswers]);

  function canContinue(current: BookingStep): boolean {
    if (current === "selection") {
      const required = (trip.optionGroups ?? []).filter((g) => g.required !== false);
      return required.every((g) => Boolean(selection[g.id]));
    }
    if (current === "custom") return bookingFormAnswersComplete(trip.bookingFormFields ?? [], customAnswers);
    if (current === "payment") return Boolean(paymentProof?.path);
    if (current === "guest") {
      return guestName.trim() !== "" && guestEmail.trim() !== "" && agreed && (!whatsappOptIn || guestPhone.trim() !== "");
    }
    return true;
  }

  if (done) {
    return (
      <BookingConfirmation
        details={{
          tripTitle: trip.title,
          selections: selectionLabels,
          seats: undefined,
          guestName,
          guestEmail,
          guestPhone,
          guestCount: Number(guestCount) || 1,
          totalEgp: total,
          mode: trip.bookingMode,
          requestNumber,
        }}
      />
    );
  }

  function submitRequest() {
    setSubmitError(null);
    startTransition(async () => {
      const payload = {
        productId: trip.id,
        fullName: guestName,
        email: guestEmail,
        phone: guestPhone,
        termsAccepted: agreed,
        guestCount: guestCountNumber,
        notes: guestNotes,
        whatsappOptIn,
        selections: {
          bookingMode: trip.bookingMode,
          selections: selectionLabels,
          ...(trip.seatBookingEnabled ? { seatSelection: "after-full-payment" } : {}),
          guestCount: guestCountNumber,
          totalEgp: total ?? null,
          customAnswers,
          customResponses: (trip.bookingFormFields ?? []).map((field) => ({
            id: field.id,
            label: field.label,
            answer: (() => {
              const answer = customAnswers[field.id];
              const ids = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [];
              return ids.length ? (field.options ?? []).filter((option) => ids.includes(option.id)).map(bookingOptionLabel) : answer ?? null;
            })(),
          })),
          ...(songRequest.trim() ? { songRequest: songRequest.trim() } : {}),
          paymentProof: paymentProof
            ? { method: paymentProof.method, path: paymentProof.path }
            : null,
        },
      };
      const result = trip.bookingMode === "booking"
        ? await submitPublicTripBooking(payload)
        : await submitPublicRequest({
            ...payload,
            requestType: "trip",
            externalSubjectId: trip.id,
            subjectSlug: trip.slug,
            subjectTitle: trip.title,
          });
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setRequestNumber("bookingNumber" in result ? result.bookingNumber : result.requestNumber);
      setDone(true);
    });
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

        {step === "custom" && trip.bookingFormFields?.length ? (
          <>
            <h2 className="pi-flow__title">{STEP_LABELS.custom}</h2>
            <TripCustomQuestions
              fields={trip.bookingFormFields}
              answers={customAnswers}
              onChange={(id, answer) => setCustomAnswers((current) => ({ ...current, [id]: answer }))}
            />
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

            <label htmlFor="guestNotes">Anything we should know? <span className="opt">(optional)</span></label>
            <textarea id="guestNotes" value={guestNotes} onChange={(e) => setGuestNotes(e.target.value)} />

            <label htmlFor="guestEmail">Email</label>
            <input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />

            <label htmlFor="guestPhone">
              Mobile / WhatsApp <span className="opt">(required for WhatsApp updates)</span>
            </label>
            <input
              id="guestPhone"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
            />

            <label htmlFor="guestCount">Number of guests</label>
            <input id="guestCount" type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} />

            {trip.songRequestEnabled ? (
              <section className="pi-song-request" aria-labelledby="songRequestLabel">
                <div className="pi-song-request__heading">
                  <span className="pi-song-request__icon" aria-hidden="true">♫</span>
                  <div>
                    <label id="songRequestLabel" htmlFor="songRequest">Add a song to the trip playlist <span className="opt">(optional)</span></label>
                    <p>Every song joins the shared playlist for the road.</p>
                  </div>
                </div>
                <input id="songRequest" value={songRequest} maxLength={180} placeholder="Song name, artist, or a link" onChange={(e) => setSongRequest(e.target.value)} />
              </section>
            ) : null}

            <label className="agree-row" htmlFor="whatsappOptIn">
              <input id="whatsappOptIn" type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} />
              <span>Send only the final Booking Confirmation and its PDF to this number on WhatsApp.</span>
            </label>

            <PolicyAcceptance checked={agreed} onChange={setAgreed} />
          </>
        ) : null}

        {step === "payment" ? (
          <>
            <h2 className="pi-flow__title">{STEP_LABELS.payment}</h2>
            <p className="pi-flow__hint">Transfer the confirmed amount, then upload the receipt. Uploading a receipt does not confirm payment until our admin checks it.</p>
            <PaymentProofStep tripId={trip.id} totalEgp={total} value={paymentProof} onChange={setPaymentProof} />
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
              {trip.seatBookingEnabled ? <div><dt>Seat selection</dt><dd>It unlocks after full payment is recorded.</dd></div> : null}
              {(trip.bookingFormFields ?? []).length ? (
                <div>
                  <dt>Trip questions</dt>
                  <dd>{(trip.bookingFormFields ?? []).map((field) => {
                    const answer = customAnswers[field.id];
                    const ids = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [];
                    const display = ids.length ? (field.options ?? []).filter((option) => ids.includes(option.id)).map(bookingOptionLabel).join(", ") : answer === true ? "Yes" : answer === false ? "No" : "—";
                    return `${field.label}: ${display}`;
                  }).join(" · ")}</dd>
                </div>
              ) : null}
              {songRequest ? <div><dt>Playlist song</dt><dd>{songRequest}</dd></div> : null}
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
              {paymentProof ? (
                <div>
                  <dt>Payment proof</dt>
                  <dd>{paymentProof.method === "instapay" ? "InstaPay" : "Vodafone Cash"} · {paymentProof.fileName}</dd>
                </div>
              ) : null}
            </dl>
            <p className="pi-flow__hint">
              {trip.bookingMode === "booking"
                ? "This completes your booking and securely sends the receipt for payment verification. Your final Booking Confirmation follows after our team verifies it."
                : "This sends your application for review. No booking is created until our team accepts it."}
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
          <Button disabled={!canContinue(step) || isPending} onClick={submitRequest}>
            {isPending
              ? "Sending…"
              : trip.bookingMode === "booking"
                ? "Send booking for payment verification"
                : "Send for confirmation"}
          </Button>
        )}
      </div>
      {submitError ? <p className="pi-flow__error" role="alert">{submitError}</p> : null}
    </div>
  );
}
