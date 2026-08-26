import "server-only";

import { SITE_COPY_DEFAULTS, SITE_COPY_FIELDS, type SiteCopy } from "@/content/site-copy";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function getSiteCopy(): Promise<SiteCopy> {
  if (!isSupabaseConfigured()) return { ...SITE_COPY_DEFAULTS };

  const supabase = await createClient();
  const keys = SITE_COPY_FIELDS.map((field) => field.key);
  const { data, error } = await supabase
    .from("settings")
    .select("key,value")
    .in("key", keys);

  if (error) return { ...SITE_COPY_DEFAULTS };

  const copy = { ...SITE_COPY_DEFAULTS };
  for (const row of data ?? []) {
    if (row.key in copy && typeof row.value === "string" && row.value.trim()) {
      copy[row.key as keyof SiteCopy] = row.value.trim();
    }
  }
  return copy;
}

