"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export async function markAllAdminNotificationsRead() {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("admin_notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  revalidatePath("/admin", "layout");
}
