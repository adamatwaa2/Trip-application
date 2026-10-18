"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { PRESENTATION_KEY, validatePresentation } from "@/content/site-presentation";

export async function saveSitePresentation(input: unknown) {
  await requireAdmin();
  if (!validatePresentation(input)) return { ok: false, error: "Check the text and links. Use site paths or secure https links; logo images must be PNG, JPG, WebP or AVIF." };
  const { error } = await (await createClient()).from("settings").upsert({ key: PRESENTATION_KEY, value: JSON.stringify(input), label: "Website appearance, footer and SEO", is_public: true, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { ok: false, error: "Changes were not saved. Please try again." };
  revalidatePath("/", "layout");
  return { ok: true };
}
