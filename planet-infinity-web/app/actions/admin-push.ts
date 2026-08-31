"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";

export async function saveAdminPushSubscription(input: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) {
  const profile = await requireAdmin();
  if (!isSupabaseServiceConfigured()) return { ok: false, error: "Push notifications are not configured yet." };
  if (!input.endpoint.startsWith("https://") || !input.p256dh || !input.auth || input.endpoint.length > 2000) {
    return { ok: false, error: "This browser did not provide a valid notification subscription." };
  }
  const supabase = createServiceClient();
  const { error } = await supabase.from("admin_push_subscriptions").upsert({
    admin_id: profile.id,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
    user_agent: (input.userAgent || "").slice(0, 500) || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (error) return { ok: false, error: "We could not save this device for notifications." };
  revalidatePath("/admin/notifications");
  return { ok: true };
}
