import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  booking_id: string | null;
  request_id: string | null;
  payment_id: string | null;
  read_at: string | null;
  created_at: string;
};

export async function getAdminNotificationCount() {
  const supabase = await createClient();
  const { count } = await supabase.from("admin_notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  return count ?? 0;
}

export async function getAdminNotifications(limit = 80) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("admin_notifications").select("id, kind, title, body, booking_id, request_id, payment_id, read_at, created_at").order("created_at", { ascending: false }).limit(limit);
  return { items: (data ?? []) as AdminNotification[], error: error?.message ?? null };
}
