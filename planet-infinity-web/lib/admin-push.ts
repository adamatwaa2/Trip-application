import "server-only";

import webpush from "web-push";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";

type PushPayload = { title: string; body: string; url?: string };

function configured() {
  return Boolean(
    isSupabaseServiceConfigured()
      && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      && process.env.VAPID_PRIVATE_KEY
      && process.env.VAPID_SUBJECT,
  );
}

export async function sendAdminPush(payload: PushPayload) {
  if (!configured()) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  const supabase = createServiceClient();
  const { data: subscriptions } = await supabase
    .from("admin_push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  if (!subscriptions?.length) return;

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify({ ...payload, url: payload.url || "/admin/notifications" }),
      );
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("admin_push_subscriptions").delete().eq("id", subscription.id);
      }
    }
  }));
}
