import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnvironment } from "./env";

export function isSupabaseServiceConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Server-only privileged client for verified payment and notification webhooks.
 * Never import this module into a Client Component or expose its key.
 */
export function createServiceClient() {
  const { url } = getSupabaseEnvironment();
  const serverKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serverKey) {
    throw new Error("SUPABASE_SECRET_KEY is not configured.");
  }

  return createClient(url, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
