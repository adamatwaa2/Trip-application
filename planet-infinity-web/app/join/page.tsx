import type { Metadata } from "next";
import { RecruitmentExperience } from "@/components/RecruitmentExperience";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSiteCopy } from "@/lib/site-copy";
import "./join.css";

export const metadata: Metadata = {
  title: "Join a World",
  description: "Join the crews building Planet Infinity worlds, experiences and stories.",
  alternates: { canonical: "/join" },
};

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ previewStep?: string; world?: string }> }) {
  const previewMode = !isSupabaseConfigured();
  const [query, copy] = await Promise.all([searchParams, getSiteCopy()]);
  const requestedStep = Number(query.previewStep);
  const initialPreview = previewMode && Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep <= 2
    ? { step: requestedStep, world: query.world || "pirates" }
    : undefined;
  return <RecruitmentExperience previewMode={previewMode} initialPreview={initialPreview} careersCopy={{ eyebrow: copy.careers_eyebrow, title: copy.careers_title, subtitle: copy.careers_subtitle, lede: copy.careers_lede }} />;
}
