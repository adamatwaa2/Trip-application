import { getAdminProfile } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { INTERNAL_EVENT_DOCUMENTS_BUCKET, isDocumentFilename, isEventId } from "@/lib/internal-event-documents";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string; filename: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" };
  if (!await getAdminProfile()) return new Response("Admin access required.", { status: 401, headers });
  const { id, filename } = await params;
  if (!isEventId(id) || !isDocumentFilename(filename)) return new Response("Not found.", { status: 404, headers });
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(INTERNAL_EVENT_DOCUMENTS_BUCKET).download(`${id}/${filename}`);
  if (error || !data) return new Response("Not found.", { status: 404, headers });
  const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
  return new Response(data, { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename="${filename}"`, "Content-Security-Policy": "sandbox" } });
}
