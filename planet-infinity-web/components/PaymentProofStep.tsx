"use client";

import { useState } from "react";
import { createPaymentProofUploadTarget } from "@/app/actions/requests";
import { createClient } from "@/lib/supabase/client";

export type PaymentProofValue = {
  method: "instapay" | "vodafone_cash";
  path: string;
  fileName: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp";

export function PaymentProofStep({
  tripId,
  totalEgp,
  value,
  onChange,
}: {
  tripId: string;
  totalEgp?: number;
  value: PaymentProofValue | null;
  onChange: (value: PaymentProofValue | null) => void;
}) {
  const [method, setMethod] = useState<PaymentProofValue["method"]>(value?.method ?? "instapay");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instapayAddress = process.env.NEXT_PUBLIC_INSTAPAY_ADDRESS ?? "adamatwaa2@instapay";
  const paymentNumber = process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER ?? "01096896247";

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
      onChange({ method, path: target.path, fileName: file.name });
    } catch (uploadError) {
      onChange(null);
      setError(uploadError instanceof Error ? uploadError.message : "The receipt upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="pi-payment-proof">
      <div className="pi-payment-proof__details">
        <p><strong>Amount:</strong> {totalEgp !== undefined ? `${totalEgp.toLocaleString("en-US")} EGP` : "Use the amount confirmed by Planet Infinity"}</p>
        <p><strong>InstaPay:</strong> {instapayAddress}</p>
        <p><strong>Vodafone Cash / number:</strong> {paymentNumber}</p>
      </div>
      <fieldset>
        <legend>How did you pay?</legend>
        <label className="agree-row"><input type="radio" name="payment-method" value="instapay" checked={method === "instapay"} onChange={() => { setMethod("instapay"); if (value) onChange({ ...value, method: "instapay" }); }} /><span>InstaPay</span></label>
        <label className="agree-row"><input type="radio" name="payment-method" value="vodafone_cash" checked={method === "vodafone_cash"} onChange={() => { setMethod("vodafone_cash"); if (value) onChange({ ...value, method: "vodafone_cash" }); }} /><span>Vodafone Cash</span></label>
      </fieldset>
      <label className="pi-receipt-upload">
        <span>{uploading ? "Uploading receipt…" : value ? "Replace receipt image" : "Upload payment receipt"}</span>
        <input type="file" accept={ACCEPT} disabled={uploading} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void upload(file); }} />
      </label>
      <p className="pi-flow__hint">JPG, PNG, or WebP up to 10 MB. This image is private and visible only to authorized admins.</p>
      {value ? <p className="pi-flow__success">Receipt uploaded: {value.fileName}</p> : null}
      {error ? <p className="pi-flow__error" role="alert">{error}</p> : null}
    </div>
  );
}
