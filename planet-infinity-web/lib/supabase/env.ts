export type SupabaseEnvironment = {
  url: string;
  publishableKey: string;
};

export function isSupabaseConfigured(): boolean {
  if (process.env.PI_LOCAL_PREVIEW === "1") return false;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function getSupabaseEnvironment(): SupabaseEnvironment {
  if (process.env.PI_LOCAL_PREVIEW === "1") throw new Error("Live data access is disabled in the isolated local preview.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local."
    );
  }

  return { url, publishableKey };
}
