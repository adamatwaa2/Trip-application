"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { sendAdminPush } from "@/lib/admin-push";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { applicationStatuses, commonRecruitmentQuestions, getRecruitmentCategory, getRecruitmentRole, getRecruitmentWorld, worldCrewQuestions, type ApplicationStatus } from "@/content/recruitment";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const uploadTypes: Record<string, { extension: string; max: number; kind: "photo" }> = {
  "image/jpeg": { extension: "jpg", max: 5 * 1024 * 1024, kind: "photo" },
  "image/png": { extension: "png", max: 5 * 1024 * 1024, kind: "photo" },
  "image/webp": { extension: "webp", max: 5 * 1024 * 1024, kind: "photo" },
};

function text(value: unknown, max = 2000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export type RecruitmentApplicationInput = {
  draftId: string;
  category: string;
  world?: string;
  role: string;
  fullName: string;
  email: string;
  phone: string;
  age: string;
  city: string;
  country: string;
  currentBase: string;
  egyptBased: string;
  attendEgypt: string;
  workMode: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  portfolio?: string;
  about: string;
  similarBefore: string;
  answers: Record<string, string>;
  uploads?: Array<{ kind: "photo"; path: string; fileName: string }>;
  termsAccepted: boolean;
};

export async function createRecruitmentUploadTarget(input: { draftId: string; mimeType: string; size: number }) {
  const rule = uploadTypes[input.mimeType];
  if (!UUID.test(input.draftId) || !rule || !Number.isInteger(input.size) || input.size < 1 || input.size > rule.max) {
    return { ok: false as const, error: "Upload a JPG, PNG or WebP photo up to 5 MB." };
  }
  if (!isSupabaseServiceConfigured()) return { ok: false as const, error: "Secure uploads are not configured yet." };
  const month = new Date().toISOString().slice(0, 7);
  const path = `recruitment/${month}/${input.draftId}/${crypto.randomUUID()}.${rule.extension}`;
  const { data, error } = await createServiceClient().storage.from("recruitment-files").createSignedUploadUrl(path);
  if (error || !data?.token) return { ok: false as const, error: "The secure upload could not start." };
  return { ok: true as const, bucket: "recruitment-files", path, token: data.token, kind: rule.kind };
}

export async function submitRecruitmentApplication(input: RecruitmentApplicationInput) {
  if (!input || typeof input !== "object") return { ok: false as const, error: "The application is invalid." };
  const category = getRecruitmentCategory(input.category);
  const role = getRecruitmentRole(input.category, input.role);
  const world = input.category === "world-crew" ? getRecruitmentWorld(input.world ?? "") : undefined;
  if (!UUID.test(input.draftId) || !category || !role || (input.category === "world-crew" && !world)) return { ok: false as const, error: "Choose a valid category, world and role." };
  if (text(input.fullName, 120).length < 2 || !EMAIL.test(text(input.email, 254)) || text(input.phone, 40).length < 6) return { ok: false as const, error: "Complete your name, email and WhatsApp number." };
  if (!/^\d{1,3}$/.test(text(input.age, 3)) || Number(input.age) < 1 || !text(input.city, 120) || !text(input.country, 120) || !text(input.currentBase, 160)) return { ok: false as const, error: "Complete your age and location details." };
  if (!input.termsAccepted) return { ok: false as const, error: "Accept the privacy policy before submitting." };
  if (!["Yes", "No"].includes(input.egyptBased) || !["Yes", "No", "It depends"].includes(input.attendEgypt) || !["Egypt-based", "Remote", "Flexible"].includes(input.workMode)) return { ok: false as const, error: "Complete your work location preferences." };
  if (text(input.about).length < 21) return { ok: false as const, error: "Tell us a little about yourself before submitting." };
  for (const value of [input.instagram, input.tiktok, input.linkedin, input.portfolio]) {
    if (!value) continue;
    try { const url = new URL(value); if (!["https:", "http:"].includes(url.protocol)) throw new Error(); } catch { return { ok: false as const, error: "Use a full website link starting with https://." }; }
  }
  const requiredQuestions = [...commonRecruitmentQuestions, ...(input.category === "world-crew" ? worldCrewQuestions : []), ...(role.questions ?? [])].filter((question) => question.required);
  if (requiredQuestions.some((question) => !text(input.answers?.[question.id], 2000))) return { ok: false as const, error: "Complete the required role questions." };
  if (requiredQuestions.some((question) => {
    if (!question.options) return false;
    const values = question.type === "multiselect" ? text(input.answers?.[question.id]).split(" | ").filter(Boolean) : [input.answers?.[question.id]];
    return !values.length || values.some((value) => !question.options?.includes(value));
  })) return { ok: false as const, error: "Choose from the listed answers for each application question." };
  const uploads = input.uploads ?? [];
  if (!Array.isArray(uploads) || uploads.length > 1 || uploads.some((file) => !file || file.kind !== "photo" || typeof file.path !== "string" || !new RegExp(`^recruitment/\\d{4}-\\d{2}/${input.draftId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`, "i").test(file.path))) return { ok: false as const, error: "The uploaded photo is invalid. Please select it again." };
  const questions = [...commonRecruitmentQuestions, ...(input.category === "world-crew" ? worldCrewQuestions : []), ...(role.questions ?? [])];
  const payload = {
    draftId: input.draftId, category: category.id, world: world?.id ?? null, role: role.id,
    fullName: text(input.fullName, 120), email: text(input.email, 254).toLowerCase(), phone: text(input.phone, 40), age: text(input.age, 3), city: text(input.city, 120), country: text(input.country, 120), currentBase: text(input.currentBase, 160),
    egyptBased: input.egyptBased, attendEgypt: input.attendEgypt, workMode: input.workMode,
    instagram: text(input.instagram, 500), tiktok: text(input.tiktok, 500), linkedin: text(input.linkedin, 500), portfolio: text(input.portfolio, 500),
    about: text(input.about), similarBefore: text(input.similarBefore), termsAccepted: true,
    answers: Object.fromEntries(questions.filter((question) => text(input.answers?.[question.id])).map((question) => [question.label, text(input.answers[question.id])])),
    uploads: uploads.map((file) => ({ ...file, fileName: text(file.fileName, 120) })),
  };
  if (JSON.stringify(payload).length > 45_000) return { ok: false as const, error: "The application is too large. Shorten a few answers and try again." };
  if (!isSupabaseConfigured()) return { ok: true as const, requestNumber: `PREVIEW-${input.draftId.slice(0, 8).toUpperCase()}`, preview: true as const };
  if (!isSupabaseServiceConfigured()) return { ok: false as const, error: "Applications are temporarily unavailable. Please try again later." };
  const supabase = createServiceClient();
  for (const file of uploads) {
    const parts = file.path.split("/");
    const name = parts.pop()!;
    const { data: files, error: fileError } = await supabase.storage.from("recruitment-files").list(parts.join("/"), { search: name, limit: 2 });
    if (fileError || !files?.some((entry) => entry.name === name)) return { ok: false as const, error: "An attachment did not finish uploading. Please try again." };
  }
  const { data, error } = await supabase.rpc("submit_recruitment_application", { p_payload: payload });
  const requestNumber = data?.[0]?.request_number;
  if (error || !requestNumber) return { ok: false as const, error: error?.message.includes("Please wait") ? "This application was already received. Please wait before trying again." : "We could not save the application. Please try again." };
  after(async () => sendAdminPush({ title: "New career application", body: `${requestNumber} · ${role.title}`, url: "/admin/applications" }));
  return { ok: true as const, requestNumber, preview: false as const };
}

export async function updateApplicationStatus(input: { requestId: string; status: ApplicationStatus; note: string }) {
  await requireAdmin();
  if (!UUID.test(input.requestId) || !applicationStatuses.includes(input.status)) return { ok: false as const, error: "Invalid application update." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_recruitment_application", { p_request_id: input.requestId, p_status: input.status, p_note: text(input.note) || null });
  if (error) return { ok: false as const, error: "The application could not be updated." };
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/requests/${input.requestId}`);
  return { ok: true as const };
}
