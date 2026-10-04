"use client";

import { PaymentProofStep, type PaymentProofValue } from "./PaymentProofStep";

export type TripPaymentMethod = "paymob" | "manual";

export function TripPaymentStep({
  tripId,
  totalEgp,
  method,
  proof,
  onMethodChange,
  onProofChange,
}: {
  tripId: string;
  totalEgp?: number;
  method: TripPaymentMethod | null;
  proof: PaymentProofValue | null;
  onMethodChange: (method: TripPaymentMethod) => void;
  onProofChange: (proof: PaymentProofValue | null) => void;
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
          <span className="pi-payment-method__copy">Secure card checkout opens as soon as your booking reference is created.</span>
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
        <div className="pi-payment-methods__notice">
          <strong>Next:</strong> review your booking, then continue to Paymob&apos;s secure checkout.
        </div>
      ) : null}
      {method === "manual" ? (
        <PaymentProofStep tripId={tripId} totalEgp={totalEgp} value={proof} onChange={onProofChange} />
      ) : null}
    </div>
  );
}
