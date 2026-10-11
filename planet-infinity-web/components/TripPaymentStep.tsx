"use client";

import { PaymentProofStep, type PaymentProofValue } from "./PaymentProofStep";
import { PaymobPixelCheckout } from "./PaymobPixelCheckout";

export type TripPaymentMethod = "paymob" | "manual";

export function TripPaymentStep({
  tripId,
  totalEgp,
  method,
  proof,
  onMethodChange,
  onProofChange,
  paymentToken,
  paymobPending,
  paymobError,
  onStartPaymob,
}: {
  tripId: string;
  totalEgp?: number;
  method: TripPaymentMethod | null;
  proof: PaymentProofValue | null;
  onMethodChange: (method: TripPaymentMethod) => void;
  onProofChange: (proof: PaymentProofValue | null) => void;
  paymentToken?: string;
  paymobPending: boolean;
  paymobError: string | null;
  onStartPaymob: () => void;
}) {
  return (
    <div className="pi-payment-methods">
      <p className="pi-payment-methods__intro">
        Choose how you want to pay{totalEgp !== undefined ? ` ${totalEgp.toLocaleString("en-US")} EGP` : ""}. Your card details are handled only by Paymob; Planet Infinity never stores them.
      </p>
      <div className="pi-payment-methods__grid" role="radiogroup" aria-label="Payment method">
        <label className={`pi-payment-method ${method === "paymob" ? "pi-payment-method--selected" : ""}`}>
          <input type="radio" name="booking-payment-method" checked={method === "paymob"} onChange={() => onMethodChange("paymob")} />
          <span className="pi-payment-method__top">
            <strong>Pay online</strong>
            <span className="pi-payment-badge pi-payment-badge--paymob">Paymob</span>
          </span>
          <span className="pi-payment-method__copy">Pay securely here without leaving this page.</span>
          <span className="pi-payment-method__badges" aria-label="Secure card payment">
            <span className="pi-payment-badge">Visa</span>
            <span className="pi-payment-badge">Mastercard</span>
            <span className="pi-payment-badge">Secure checkout</span>
          </span>
        </label>

        <label className={`pi-payment-method ${method === "manual" ? "pi-payment-method--selected" : ""}`}>
          <input type="radio" name="booking-payment-method" checked={method === "manual"} onChange={() => onMethodChange("manual")} />
          <span className="pi-payment-method__top">
            <strong>InstaPay / transfer</strong>
            <span className="pi-payment-badge pi-payment-badge--instapay">InstaPay</span>
          </span>
          <span className="pi-payment-method__copy">Transfer the amount, then upload the receipt privately for verification.</span>
          <span className="pi-payment-method__badges">
            <span className="pi-payment-badge">InstaPay</span>
            <span className="pi-payment-badge">Vodafone Cash</span>
          </span>
        </label>
      </div>

      {method === "paymob" ? (
        paymentToken ? (
          <PaymobPixelCheckout paymentToken={paymentToken} />
        ) : (
          <div className="pi-paymob-inline">
            <p>Your booking reference will be created, then the secure Paymob card form will open directly below.</p>
            <button className="pi-paymob-inline__button" type="button" onClick={onStartPaymob} disabled={paymobPending}>
              {paymobPending ? "Opening secure payment…" : `Pay online${totalEgp !== undefined ? ` · ${totalEgp.toLocaleString("en-US")} EGP` : ""}`}
            </button>
            {paymobError ? <p className="pi-flow__error" role="alert">{paymobError}</p> : null}
          </div>
        )
      ) : null}
      {method === "manual" ? (
        <PaymentProofStep tripId={tripId} totalEgp={totalEgp} value={proof} onChange={onProofChange} />
      ) : null}
    </div>
  );
}
