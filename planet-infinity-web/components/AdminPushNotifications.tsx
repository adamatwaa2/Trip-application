"use client";

import { useEffect, useState } from "react";
import { saveAdminPushSubscription } from "@/app/actions/admin-push";

function urlBase64ToUint8Array(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

/**
 * Why this can fail is worth separating out.
 *
 * "Not available in this browser" used to cover three unrelated problems, and
 * the most common one — the VAPID keys never being set on the server — is not a
 * browser problem at all. Each case now says what to actually do about it.
 */
function unavailableReason(vapidKey: string | undefined): string | null {
  if (!vapidKey) {
    return "Phone alerts are not switched on for this site yet. The VAPID keys need adding to the site settings first — once they are, this button works.";
  }
  const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isAppleMobile && !isStandalone) {
    return "On iPhone, alerts only work once this page is added to your Home Screen. Tap Share, then “Add to Home Screen”, open it from there and try again.";
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "This browser cannot send phone alerts. Open the Admin Panel directly in Chrome or Safari — not inside Instagram, Facebook or another app’s built-in browser.";
  }
  return null;
}

type PushState = "checking" | "disabled" | "enabled";

export function AdminPushNotifications({ compact = false }: { compact?: boolean }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [state, setState] = useState<PushState>("checking");
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    let active = true;
    async function checkExistingSubscription() {
      const blocked = unavailableReason(vapidKey);
      if (blocked || !vapidKey) {
        if (active) {
          setState("disabled");
          setMessage(blocked);
        }
        return;
      }
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!active) return;
        if (!subscription) {
          setState("disabled");
          return;
        }
        const json = subscription.toJSON();
        const result = await saveAdminPushSubscription({
          endpoint: subscription.endpoint,
          p256dh: json.keys?.p256dh || "",
          auth: json.keys?.auth || "",
          userAgent: navigator.userAgent,
        });
        if (!active) return;
        setState(result.ok ? "enabled" : "disabled");
        if (!result.ok) setMessage(result.error ?? "We could not restore notifications for this phone.");
      } catch {
        if (active) setState("disabled");
      }
    }
    void checkExistingSubscription();
    return () => { active = false; };
  }, [vapidKey]);

  async function enable() {
    const blocked = unavailableReason(vapidKey);
    if (blocked || !vapidKey) {
      setMessage(blocked);
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Allow notifications in your browser settings, then try again.");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const activeRegistration = await navigator.serviceWorker.ready || registration;
      const subscription = await activeRegistration.pushManager.getSubscription() || await activeRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = subscription.toJSON();
      const result = await saveAdminPushSubscription({
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh || "",
        auth: json.keys?.auth || "",
        userAgent: navigator.userAgent,
      });
      setState(result.ok ? "enabled" : "disabled");
      setMessage(result.ok ? "Phone notifications are on for this device." : (result.error ?? "We could not save this device for notifications."));
    } catch {
      setMessage("We could not enable notifications on this device. Try again from Chrome or Safari.");
    } finally {
      setPending(false);
    }
  }

  if (compact && state === "enabled") return null;

  return <div className={compact ? "pi-admin-push pi-admin-push--banner" : "pi-admin-push"}><div><strong>{state === "enabled" ? "Phone notifications are on" : "Turn on phone notifications"}</strong><p>{state === "enabled" ? "This phone will receive new booking and payment alerts." : "Get new booking and payment alerts on this phone, even when the Admin Panel is closed."}</p></div>{state !== "enabled" ? <button className="pi-admin-button" type="button" onClick={enable} disabled={pending || state === "checking"}>{pending || state === "checking" ? "Checking…" : "Enable on this phone"}</button> : null}{message ? <p role="status">{message}</p> : null}</div>;
}
