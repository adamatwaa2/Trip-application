import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAdminProfile } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { INTERNAL_DOCUMENT_MAX_BYTES, INTERNAL_EVENT_DOCUMENTS_BUCKET, isEventId } from "@/lib/internal-event-documents";

export const runtime = "nodejs";
const failure = (error: string, status: number) => Response.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminProfile()) return failure("Admin access required.", 401);
  if (request.headers.get("origin") !== new URL(request.url).origin) return failure("Please upload from the admin page.", 403);
  const { id } = await params;
  if (!isEventId(id)) return failure("Event not found.", 404);
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("id").eq("id", id).maybeSingle();
  if (!event) return failure("Event not found.", 404);
  if (Number(request.headers.get("content-length")) > INTERNAL_DOCUMENT_MAX_BYTES + 65536) return failure("The PDF must be 4 MB or smaller.", 413);
  let form: FormData;
  try { form = await request.formData(); } catch { return failure("Choose a valid PDF.", 400); }
  const file = form.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".pdf") || file.size < 5 || (file.type && file.type !== "application/pdf")) return failure("Choose a PDF file.", 400);
  if (file.size > INTERNAL_DOCUMENT_MAX_BYTES) return failure("The PDF must be 4 MB or smaller.", 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return failure("This file is not a valid PDF.", 400);
  const base = file.name.slice(0, -4).replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "Document";
  const { error } = await supabase.storage.from(INTERNAL_EVENT_DOCUMENTS_BUCKET).upload(`${id}/${randomUUID()}-${base}.pdf`, bytes, { contentType: "application/pdf", upsert: false });
  if (error) return failure("Could not save the private PDF. Please try again.", 500);
  revalidatePath(`/admin/events/${id}`);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
