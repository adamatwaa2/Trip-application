import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import { PRESENTATION_DEFAULTS, PRESENTATION_KEY, validatePresentation } from "@/content/site-presentation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const getSitePresentation = cache(async () => {
  if (!isSupabaseConfigured()) return structuredClone(PRESENTATION_DEFAULTS);
  const { data } = await (await createClient()).from("settings").select("value").eq("key", PRESENTATION_KEY).maybeSingle();
  try {
    const value: unknown = typeof data?.value === "string" ? JSON.parse(data.value) : data?.value;
    if (validatePresentation(value)) return value;
  } catch { /* Invalid settings never break the public website. */ }
  return structuredClone(PRESENTATION_DEFAULTS);
});

export async function getPageSeoMetadata(path: string, fallbackTitle: string, fallbackDescription: string): Promise<Metadata> {
  const settings = await getSitePresentation();
  const page = settings.pageSeo.find(item => item.path === path);
  const title = page?.title.trim() || fallbackTitle;
  const description = page?.description.trim() || fallbackDescription;
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path, images: [settings.shareImage] }, twitter: { card: "summary_large_image", title, description, images: [settings.shareImage] } };
}
