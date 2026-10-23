"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { createPaymobCheckout } from "@/app/actions/payments";

export function PaymobPixelCheckout({ paymentToken, returnPath, primaryColor = "#f2a33a" }: { paymentToken: string; returnPath?: string; primaryColor?: string }) {
  const router = useRouter();
  const reactId = useId();
  const elementId = `paymob-pixel-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [status, setStatus] = useState<"loading" | "ready" | "submitted" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = document.getElementById(elementId);

    async function mountPixel() {
      setStatus("loading");
      setError(null);
      const checkout = await createPaymobCheckout(paymentToken);
      if (cancelled) return;
      if (!checkout.ok) {
        setError(checkout.error);
        setStatus("error");
        return;
      }

      try {
        await import("paymob-pixel");
        if (cancelled) return;
        if (!window.Pixel) throw new Error("Paymob Pixel did not load.");

        new window.Pixel({
          publicKey: checkout.publicKey,
          clientSecret: checkout.clientSecret,
          paymentMethods: ["card"],
          elementId,
          disablePay: false,
          showSaveCard: false,
          forceSaveCard: false,
          showPaymobLogo: true,
          afterPaymentComplete: () => { setStatus("submitted"); if (returnPath) router.push(returnPath); },
          customStyle: {
            Color_Primary: primaryColor,
            Color_Container: "#fffaf2",
            Color_Border_Input_Fields: "#bfd0d8",
            Color_Border_Payment_Button: primaryColor,
            Radius_Border: "16",
            Text_Color_For_Label: "#071821",
            Text_Color_For_Input_Fields: "#071821",
            Text_Color_For_Payment_Button: primaryColor === "#f2a33a" ? "#071821" : "#fffaf2",
            Color_For_Text_Placeholder: "#687d87",
            Width_of_Container: "100%",
            Container_Padding: "18",
            Vertical_Spacing_between_components: "12",
          },
        });
        setStatus("ready");
      } catch (pixelError) {
        console.error("Paymob Pixel failed to mount", pixelError);
        setError("The secure Paymob form could not load. Please try again.");
        setStatus("error");
      }
    }

    void mountPixel();
    return () => {
      cancelled = true;
      if (container) container.replaceChildren();
    };
  }, [elementId, paymentToken, returnPath, router, primaryColor]);

  return (
    <section className="pi-paymob-pixel" aria-live="polite">
      <div className="pi-paymob-pixel__head">
        <div>
          <strong>Secure Paymob payment</strong>
          <span>Enter your card details here. You will stay on this page.</span>
        </div>
        <span className="pi-payment-badge pi-payment-badge--paymob">Paymob</span>
      </div>
      {status === "loading" ? <p className="pi-paymob-pixel__status">Opening the secure payment form…</p> : null}
      {status === "submitted" ? <p className="pi-paymob-pixel__success">Payment submitted. We are confirming it securely.</p> : null}
      {error ? <p className="pi-flow__error" role="alert">{error}</p> : null}
      <div id={elementId} className="pi-paymob-pixel__mount" hidden={status === "error"} />
    </section>
  );
}
