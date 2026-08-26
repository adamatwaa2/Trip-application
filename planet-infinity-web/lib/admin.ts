import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  full_name: string | null;
  role: "admin";
  is_active: boolean;
};

export const getAdminProfile = cache(async (): Promise<AdminProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return null;

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, full_name, role, is_active")
    .eq("id", userId)
    .eq("role", "admin")
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as AdminProfile;
});

/** This is intentionally called in every protected page and mutation. */
export async function requireAdmin(): Promise<AdminProfile> {
  if (!isSupabaseConfigured()) redirect("/admin/login?reason=configuration");

  const profile = await getAdminProfile();
  if (!profile) redirect("/admin/login");
  return profile;
}
