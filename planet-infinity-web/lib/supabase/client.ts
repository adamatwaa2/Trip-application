import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnvironment } from "./env";

/** Browser client. It only uses Supabase's publishable key. */
export function createClient() {
  const { url, publishableKey } = getSupabaseEnvironment();
  return createBrowserClient(url, publishableKey);
}
