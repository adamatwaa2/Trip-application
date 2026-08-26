"use client";

import { useState, useTransition } from "react";
import { createPaymobCheckout } from "@/app/actions/payments";
import styles from "./PaymobCheckoutButton.module.css";

export function PaymobCheckoutButton({ paymentToken }: { paymentToken: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
            window.location.assign(result.checkoutUrl);
          });
        }}
      >
        {pending ? "Opening secure checkout…" : "Pay securely by card"}
      </button>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </>
  );
}
