"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PaymobCheckoutFrame.module.css";

/**
 * The hosted card form, shown inside the page.
 *
 * The fields belong to the payment provider and are served from their origin,
 * so card details never touch Planet Infinity — but the guest stays on the
 * booking page instead of being sent to another site.
 *
 * Some providers refuse to be framed. That cannot be detected directly from
 * the parent, so a refusal shows as a frame that never reports a load: after a
 * short grace period the panel offers a normal link out as a fallback, which
 * also covers a guest whose browser blocks third-party frames.
 */
export function PaymobCheckoutFrame({
  checkoutUrl,
  amountLabel,
}: {
  checkoutUrl: string;
  amountLabel?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className={styles.panel} aria-label="Secure card payment">
      <div className={styles.head}>
        <h3 className={styles.title}>
          {amountLabel ? `Pay ${amountLabel}` : "Pay securely"}
        </h3>
        <p className={styles.note}>
          Enter your card details below. The form is served by our payment provider —
          Planet Infinity never sees or stores your card number.
        </p>
      </div>

      <div className={styles.frameWrap}>
        {!loaded ? <p className={styles.loading}>Loading the secure card form…</p> : null}
        <iframe
          ref={frameRef}
          className={styles.frame}
          src={checkoutUrl}
          title="Secure card payment"
          allow="payment *"
          referrerPolicy="origin"
          onLoad={() => setLoaded(true)}
        />
      </div>

      {!loaded && slow ? (
        <p className={styles.fallback}>
          Taking longer than expected?{" "}
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
            Open the secure payment page in a new tab
          </a>
          .
        </p>
      ) : null}
    </section>
  );
}
