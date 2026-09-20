"use client";

import { useState, useTransition } from "react";
import { createPaymobCheckout } from "@/app/actions/payments";
import { PaymobCheckoutFrame } from "./PaymobCheckoutFrame";
import styles from "./PaymobCheckoutButton.module.css";

export function PaymobCheckoutButton({
  paymentToken,
  amountLabel,
}: {
  paymentToken: string;
  amountLabel?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Once the payment has started the card form takes over this block; sending
  // the guest to another site is no longer part of the flow.
  if (checkoutUrl) return <PaymobCheckoutFrame checkoutUrl={checkoutUrl} amountLabel={amountLabel} />;

  return (
    <>
      <button
        className={styles.button}
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await createPaymobCheckout(paymentToken);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setCheckoutUrl(result.checkoutUrl);
          });
        }}
      >
        {pending ? "Opening the card form…" : "Pay securely by card"}
      </button>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </>
  );
}
