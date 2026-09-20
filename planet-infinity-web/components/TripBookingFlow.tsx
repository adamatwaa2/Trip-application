"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import {
  BookingPaymentStep,
  type BookingPaymentMethod,
  type PaymentProofValue,
} from "./BookingPaymentStep";
import { createPaymobCheckout } from "@/app/actions/payments";
import { PaymobCheckoutFrame } from "./PaymobCheckoutFrame";
import { trackMetaCustomEvent, trackMetaEvent } from "@/lib/meta-pixel";

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
export function TripBookingFlow({
  trip,
  paymobCardEnabled = false,
  paymobWalletEnabled = false,
}: {
  trip: Trip;
  paymobCardEnabled?: boolean;
  paymobWalletEnabled?: boolean;
}) {
  const steps = useMemo(() => bookingSteps(trip), [trip]);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);

  const [selection, setSelection] = useState<SelectionState>({});
  const [guestEmail, setGuestEmail] = useState("");
  const [guests, setGuests] = useState<{ name: string; phone: string }[]>([]);
  const [guestNotes, setGuestNotes] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, BookingFormAnswer>>({});
  const [songRequest, setSongRequest] = useState("");
  const [paymentProof, setPaymentProof] = useState<PaymentProofValue | null>(null);
  // Paying online is the default whenever Paymob is live; the manual transfer
  // stays available underneath it.
  const [paymentMethod, setPaymentMethod] = useState<BookingPaymentMethod>(
    paymobCardEnabled ? "paymob_card" : paymobWalletEnabled ? "paymob_wallet" : "manual",
  );
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [requestNumber, setRequestNumber] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const checkoutTracked = useRef(false);

  const step = steps[stepIndex];
  const parsedGuestCount = Number(guestCount);
  const guestCountNumber = Number.isInteger(parsedGuestCount) && parsedGuestCount >= 1 && parsedGuestCount <= 80 ? parsedGuestCount : 0;
  const guestName = guests[0]?.name ?? "";
  const guestPhone = guests[0]?.phone ?? "";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  useEffect(() => {
    if (checkoutTracked.current) return;
    checkoutTracked.current = true;
    trackMetaEvent("InitiateCheckout", {
      content_ids: [trip.id],
      content_name: trip.title,
      content_type: "product",
      currency: "EGP",
      value: trip.priceEgp,
    });
  }, [trip.id, trip.priceEgp, trip.title]);

  function resizeGuestList(value: string) {
    setGuestCount(value);
    const enteredCount = Number(value);
    if (!Number.isInteger(enteredCount) || enteredCount < 1) {
      setGuests([]);
      setCustomAnswers((current) => Object.fromEntries(Object.entries(current).map(([fieldId, answer]) => {
        if (!answer || typeof answer !== "object" || Array.isArray(answer)) return [fieldId, answer];
        return [fieldId, {}];
      })));
      return;
    }

    const count = Math.min(80, enteredCount);
    setGuests((current) => Array.from({ length: count }, (_, index) => current[index] ?? { name: "", phone: "" }));
    setCustomAnswers((current) => Object.fromEntries(Object.entries(current).map(([fieldId, answer]) => {
      const field = (trip.bookingFormFields ?? []).find((item) => item.id === fieldId);
      if (field?.type === "quantity" && field.quantityUnit?.trim().toLowerCase() === "accommodation" && answer && typeof answer === "object" && !Array.isArray(answer)) {
        const selected = (field.options ?? []).find((option) => Number(answer[option.id]) > 0);
        const stillFits = selected && count >= (selected.minGuests ?? 1) && count <= (selected.maxGuests ?? 80);
        return [fieldId, stillFits && selected ? { [selected.id]: 1 } : {}];
      }
      if (!answer || typeof answer !== "object" || Array.isArray(answer)) return [fieldId, answer];
      return [fieldId, Object.fromEntries(Object.entries(answer).map(([optionId, quantity]) => [optionId, Math.min(count, Number(quantity) || 0)]))];
    })));
  }

  function updateGuest(index: number, patch: Partial<{ name: string; phone: string }>) {
    setGuests((current) => current.map((guest, guestIndex) => guestIndex === index ? { ...guest, ...patch } : guest));
  }

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
    const guests = guestCountNumber || 1;
    return sum * guests + bookingOptionPrice(trip.bookingFormFields ?? [], customAnswers, guests);
  }, [trip, selection, guestCountNumber, customAnswers]);

  function canContinue(current: BookingStep): boolean {
    if (current === "selection") {
      const required = (trip.optionGroups ?? []).filter((g) => g.required !== false);
      return required.every((g) => Boolean(selection[g.id]));
    }
    if (current === "custom") return guestCountNumber >= 1 && bookingFormAnswersComplete(trip.bookingFormFields ?? [], customAnswers, guestCountNumber);
    // Online methods are settled after the booking is created, so only the
    // manual transfer has anything to complete here.
    if (current === "payment") return paymentMethod === "manual" ? Boolean(paymentProof?.path) : true;
    if (current === "guest") {
      return guestCountNumber >= 1 && guests.length === guestCountNumber && guests.every((guest) => guest.name.trim().length >= 2 && guest.phone.trim().length >= 6) && guestEmail.trim() !== "" && agreed;
    }
    return true;
  }

  // The booking exists and the card form is open. Nothing here should invite
  // the guest to leave or resubmit: the booking is already theirs.
  if (checkoutUrl) {
    return (
      <div className="pi-flow">
        <div className="pi-flow__panel">
          <h2 className="pi-flow__title">Booking {requestNumber} is held for you</h2>
          <p className="pi-flow__hint">
            Complete the payment below to confirm it. If you close this page before paying, the
            booking is kept and you can pay any time from{" "}
            {paymentLink ? <Link href={paymentLink}>your booking payment page</Link> : "your booking payment link"}.
          </p>
          <PaymobCheckoutFrame
            checkoutUrl={checkoutUrl}
            amountLabel={total !== undefined ? `${total.toLocaleString("en-US")} EGP` : undefined}
          />
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <>
        {handoffError ? (
          <p className="pi-flow__error" role="alert">
            {handoffError}
            {paymentLink ? <> You can pay any time from <Link href={paymentLink}>your booking payment page</Link>.</> : null}
          </p>
        ) : null}
        <BookingConfirmation
          details={{
            tripTitle: trip.title,
            selections: selectionLabels,
            seats: undefined,
            guestName,
            guestEmail,
            guestPhone,
            guestCount: guestCountNumber,
            totalEgp: total,
            mode: trip.bookingMode,
            requestNumber,
          }}
        />
      </>
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
          selected: selection,
          totalEgp: total ?? null,
          customAnswers,
          guestRoster: guests.map((guest) => ({ name: guest.name.trim(), phone: guest.phone.trim() })),
          customResponses: (trip.bookingFormFields ?? []).map((field) => ({
            id: field.id,
            label: field.label,
            answer: (() => {
              const answer = customAnswers[field.id];
              if (answer && typeof answer === "object" && !Array.isArray(answer)) {
                return (field.options ?? [])
                  .filter((option) => Number(answer[option.id]) > 0)
                  .map((option) => `${option.label} × ${answer[option.id]}`);
              }
              const ids = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [];
              return ids.length ? (field.options ?? []).filter((option) => ids.includes(option.id)).map(bookingOptionLabel) : answer ?? null;
            })(),
          })),
          ...(songRequest.trim() ? { songRequest: songRequest.trim() } : {}),
          paymentMethod,
          // The key is omitted entirely when there is no receipt. A JSON null
          // is not a SQL NULL once it reaches jsonb, so sending one makes the
          // booking function read it as a receipt that is missing its fields
          // and reject the booking.
          ...(paymentMethod === "manual" && paymentProof
            ? { paymentProof: { method: paymentProof.method, path: paymentProof.path } }
            : {}),
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
      const completedNumber = "bookingNumber" in result ? result.bookingNumber : result.requestNumber;
      const eventParameters = {
        content_ids: [trip.id],
        content_name: trip.title,
        content_type: "product",
        currency: "EGP",
        value: total,
      };
      trackMetaEvent("Lead", eventParameters);
      trackMetaCustomEvent("BookingSubmitted", {
        ...eventParameters,
        booking_number: completedNumber,
      });

      // The booking now exists. For an online method, hand the guest straight
      // to Paymob; if that hand-off fails the booking still stands, so fall
      // through to the confirmation and point at the payment page instead.
      const paymentToken = "paymentToken" in result ? result.paymentToken : null;
      if (paymentMethod !== "manual" && paymentToken) {
        setPaymentLink(`/pay/${paymentToken}`);
        const checkout = await createPaymobCheckout(paymentToken);
        if (checkout.ok) {
          // The card form opens in place, so the guest pays without leaving
          // the booking they just made.
          setRequestNumber(completedNumber);
          setCheckoutUrl(checkout.checkoutUrl);
          return;
        }
        setHandoffError(checkout.error);
      }

      setRequestNumber(completedNumber);
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
            <label className="pi-group-size" htmlFor="guestCountCustom">
              <span><strong>Your group size</strong><small>We will show every room type; only rooms that fit your group can be selected.</small></span>
              <input id="guestCountCustom" aria-label="Number of guests" type="number" min="1" max="80" value={guestCount} onChange={(e) => resizeGuestList(e.target.value)} />
            </label>
            <TripCustomQuestions
              fields={trip.bookingFormFields}
              answers={customAnswers}
              guestCount={guestCountNumber}
              basePrice={trip.priceEgp}
              onChange={(id, answer) => setCustomAnswers((current) => ({ ...current, [id]: answer }))}
            />
          </>
        ) : null}

        {step === "guest" ? (
          <>
            <h2 className="pi-flow__title">{STEP_LABELS.guest}</h2>
            <label htmlFor="guestNotes">Anything we should know? <span className="opt">(optional)</span></label>
            <textarea id="guestNotes" value={guestNotes} onChange={(e) => setGuestNotes(e.target.value)} />

            <label htmlFor="guestEmail">Email</label>
            <input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />

            {!trip.bookingFormFields?.length ? <><label htmlFor="guestCount">Number of guests</label><input id="guestCount" type="number" min="1" max="80" value={guestCount} onChange={(e) => resizeGuestList(e.target.value)} /></> : null}

            <section className="pi-guest-roster" aria-labelledby="guestRosterTitle">
              <div className="pi-guest-roster__head">
                <div><h3 id="guestRosterTitle">Guest details</h3><p>Enter one name and mobile number for every guest. One booking email is enough.</p></div>
                <span>{guestCountNumber} guest{guestCountNumber === 1 ? "" : "s"}</span>
              </div>
              <div className="pi-guest-roster__list">
                {guests.map((guest, index) => (
                  <fieldset className="pi-guest-card" key={index}>
                    <legend>{index === 0 ? "Primary guest" : `Guest ${index + 1}`}</legend>
                    <label htmlFor={`guestName-${index}`}>Full name</label>
                    <input id={`guestName-${index}`} type="text" value={guest.name} onChange={(event) => updateGuest(index, { name: event.target.value })} />
                    <label htmlFor={`guestPhone-${index}`}>Mobile / WhatsApp</label>
                    <input id={`guestPhone-${index}`} type="tel" value={guest.phone} onChange={(event) => updateGuest(index, { phone: event.target.value })} />
                  </fieldset>
                ))}
              </div>
            </section>

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
            <p className="pi-flow__hint">Choose how you would like to settle this booking.</p>
            <BookingPaymentStep
              tripId={trip.id}
              totalEgp={total}
              cardEnabled={paymobCardEnabled}
              walletEnabled={paymobWalletEnabled}
              method={paymentMethod}
              onMethodChange={setPaymentMethod}
              proof={paymentProof}
              onProofChange={setPaymentProof}
            />
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
              {/*
                Kept deliberately short: the guest only needs to recognise what
                they are about to pay for. Every answer they gave is still on
                the booking and in the confirmation.
              */}
              <div>
                <dt>Guests</dt>
                <dd>
                  {guestCountNumber} guest{guestCountNumber === 1 ? "" : "s"}
                  {guests.some((guest) => guest.name.trim())
                    ? ` · ${guests.map((guest) => guest.name.trim()).filter(Boolean).join(", ")}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>{guestEmail || "—"}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>
                  {total !== undefined
                    ? `${total.toLocaleString("en-US")} EGP`
                    : "Price not set"}
                </dd>
              </div>
              {steps.includes("payment") ? (
                <div>
                  <dt>Payment</dt>
                  <dd>
                    {paymentMethod === "paymob_card"
                      ? "Card — secure checkout"
                      : paymentMethod === "paymob_wallet"
                        ? "Mobile wallet — secure checkout"
                        : "InstaPay / Vodafone Cash transfer"}
                  </dd>
                </div>
              ) : null}
              {paymentProof ? (
                <div>
                  <dt>Payment proof</dt>
                  <dd>{paymentProof.method === "instapay" ? "InstaPay" : "Vodafone Cash"} · {paymentProof.fileName}</dd>
                </div>
              ) : null}
            </dl>
            <p className="pi-flow__hint">
              {trip.bookingMode !== "booking"
                ? "This sends your application for review. No booking is created until our team accepts it."
                : paymentMethod === "manual"
                  ? "This completes your booking and securely sends the receipt for payment verification. Your final Booking Confirmation follows after our team verifies it."
                  : "This creates your booking and opens the card form here on this page. Your final Booking Confirmation follows once the payment clears."}
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
              ? paymentMethod !== "manual" && trip.bookingMode === "booking"
                ? "Opening the card form…"
                : "Sending…"
              : trip.bookingMode !== "booking"
                ? "Send for confirmation"
                : paymentMethod === "manual"
                  ? "Complete booking"
                  : "Continue to payment"}
          </Button>
        )}
      </div>
      {submitError ? <p className="pi-flow__error" role="alert">{submitError}</p> : null}
    </div>
  );
}
