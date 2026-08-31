"use client";

import { useState } from "react";
import { saveAdminPushSubscription } from "@/app/actions/admin-push";

function urlBase64ToUint8Array(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export function AdminPushNotifications() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  async function enable() {
    if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("Push notifications are not available in this browser yet.");
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
      setMessage(result.ok ? "Phone notifications are on for this device." : (result.error ?? "We could not save this device for notifications."));
    } catch {
      setMessage("We could not enable notifications on this device. Try again from Chrome or Safari.");
    } finally {
      setPending(false);
    }
  }

  return <div className="pi-admin-push"><div><strong>Phone notifications</strong><p>Get a lock-screen alert for new bookings and payment receipts, even when the Admin Panel is closed.</p></div><button className="pi-admin-button" type="button" onClick={enable} disabled={pending}>{pending ? "Enabling…" : "Enable on this phone"}</button>{message ? <p role="status">{message}</p> : null}</div>;
}
