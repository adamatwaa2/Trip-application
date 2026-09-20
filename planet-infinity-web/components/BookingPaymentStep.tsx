"use client";

import { useState } from "react";
import { createPaymentProofUploadTarget } from "@/app/actions/requests";
import { createClient } from "@/lib/supabase/client";

export type PaymentProofValue = {
  method: "instapay" | "vodafone_cash";
  path: string;
  fileName: string;
};

/**
 * How the guest chose to settle the booking.
 *
 * The two Paymob methods hand the guest to Paymob's hosted checkout right
 * after the booking is created — Planet Infinity never sees card details.
 * "manual" is the transfer-and-upload path, kept as a secondary option.
 */
export type BookingPaymentMethod = "paymob_card" | "paymob_wallet" | "manual";

const ACCEPT = "image/jpeg,image/png,image/webp";

export function BookingPaymentStep({
  tripId,
  totalEgp,
  cardEnabled,
  walletEnabled,
  method,
  onMethodChange,
  proof,
  onProofChange,
}: {
  tripId: string;
  totalEgp?: number;
  cardEnabled: boolean;
  walletEnabled: boolean;
  method: BookingPaymentMethod;
  onMethodChange: (method: BookingPaymentMethod) => void;
  proof: PaymentProofValue | null;
  onProofChange: (value: PaymentProofValue | null) => void;
}) {
  const [transferMethod, setTransferMethod] = useState<PaymentProofValue["method"]>(proof?.method ?? "instapay");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instapayAddress = process.env.NEXT_PUBLIC_INSTAPAY_ADDRESS ?? "adamatwaa2@instapay";
  const paymentNumber = process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER ?? "01096896247";
  const amountLabel = totalEgp !== undefined
    ? `${totalEgp.toLocaleString("en-US")} EGP`
    : "the amount confirmed by Planet Infinity";

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const target = await createPaymentProofUploadTarget({ tripId, mimeType: file.type, size: file.size });
      if (!target.ok) throw new Error(target.error);
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(target.bucket)
        .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw new Error("The receipt image could not be uploaded.");
      onProofChange({ method: transferMethod, path: target.path, fileName: file.name });
    } catch (uploadError) {
      onProofChange(null);
      setError(uploadError instanceof Error ? uploadError.message : "The receipt upload failed.");
    } finally {
      setUploading(false);
    }
  }

  /** Switching away from the transfer option drops any receipt attached to it. */
  function chooseMethod(next: BookingPaymentMethod) {
    onMethodChange(next);
    if (next !== "manual" && proof) onProofChange(null);
  }

  return (
    <div className="pi-payment-proof">
      <fieldset className="pi-payment-methods">
        <legend>How would you like to pay?</legend>

        {cardEnabled ? (
          <label className="pi-payment-method">
            <input
              type="radio"
              name="booking-payment-method"
              value="paymob_card"
              checked={method === "paymob_card"}
              onChange={() => chooseMethod("paymob_card")}
            />
            <span>
              <strong>Pay now by card</strong>
              <small>Visa or Mastercard, on a secure checkout page. Your card details are never seen or stored by us.</small>
            </span>
          </label>
        ) : null}

        {walletEnabled ? (
          <label className="pi-payment-method">
            <input
              type="radio"
              name="booking-payment-method"
              value="paymob_wallet"
              checked={method === "paymob_wallet"}
              onChange={() => chooseMethod("paymob_wallet")}
            />
            <span>
              <strong>Pay now by mobile wallet</strong>
              <small>Vodafone Cash, Etisalat, Orange or WE, on a secure checkout page.</small>
            </span>
          </label>
        ) : null}

        <label className="pi-payment-method">
          <input
            type="radio"
            name="booking-payment-method"
            value="manual"
            checked={method === "manual"}
            onChange={() => chooseMethod("manual")}
          />
          <span>
            <strong>Transfer yourself and upload a receipt</strong>
            <small>InstaPay or Vodafone Cash to our account. Our team verifies it before the booking is confirmed.</small>
          </span>
        </label>
      </fieldset>

      {method !== "manual" ? (
        <p className="pi-flow__hint">
          You will be taken to a secure checkout page to pay {amountLabel} as soon as you complete the booking.
          If anything interrupts the payment, your booking is kept and you can pay from your booking link.
        </p>
      ) : (
        <>
          <div className="pi-payment-proof__details">
            <p><strong>Amount:</strong> {amountLabel}</p>
            <p><strong>InstaPay:</strong> {instapayAddress}</p>
            <p><strong>Vodafone Cash / number:</strong> {paymentNumber}</p>
          </div>
          <fieldset>
            <legend>How did you pay?</legend>
            <label className="agree-row">
              <input
                type="radio"
                name="transfer-method"
                value="instapay"
                checked={transferMethod === "instapay"}
                onChange={() => { setTransferMethod("instapay"); if (proof) onProofChange({ ...proof, method: "instapay" }); }}
              />
              <span>InstaPay</span>
            </label>
            <label className="agree-row">
              <input
                type="radio"
                name="transfer-method"
                value="vodafone_cash"
                checked={transferMethod === "vodafone_cash"}
                onChange={() => { setTransferMethod("vodafone_cash"); if (proof) onProofChange({ ...proof, method: "vodafone_cash" }); }}
              />
              <span>Vodafone Cash</span>
            </label>
          </fieldset>
          <label className="pi-receipt-upload">
            <span>{uploading ? "Uploading receipt…" : proof ? "Replace receipt image" : "Upload payment receipt"}</span>
            <input
              type="file"
              accept={ACCEPT}
              disabled={uploading}
              onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void upload(file); }}
            />
          </label>
          <p className="pi-flow__hint">JPG, PNG, or WebP up to 10 MB. This image is private and visible only to authorized admins.</p>
          {proof ? <p className="pi-flow__success">Receipt uploaded: {proof.fileName}</p> : null}
        </>
      )}

      {error ? <p className="pi-flow__error" role="alert">{error}</p> : null}
    </div>
  );
}
