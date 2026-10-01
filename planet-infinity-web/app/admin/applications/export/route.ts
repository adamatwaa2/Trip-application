import { requireAdmin } from "@/lib/admin";
import { getApplications } from "@/lib/admin-requests";

function csv(value: unknown) {
  const raw = String(value ?? "");
  const safe = /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
export async function GET(request: Request) {
  await requireAdmin();
  const filters = Object.fromEntries(new URL(request.url).searchParams);
  const { applications, error } = await getApplications(filters, true);
  if (error) return new Response(error, { status: 503, headers: { "cache-control": "no-store" } });
  const headers = ["Reference","Submitted","Name","Email","Phone","Category","World","Role","City","Country","Egypt based","Work mode","Status","Instagram","TikTok","LinkedIn","Portfolio","Internal note"];
  const rows = applications.map((item) => { const s = item.selections; return [item.request_number,item.created_at,item.customer?.full_name,item.customer?.email,item.customer?.phone,item.application_category,item.application_world,item.application_role,item.application_city,item.application_country,item.application_egypt_based === null ? "" : item.application_egypt_based ? "Yes" : "No",item.application_work_mode,item.application_status,s.instagram,s.tiktok,s.linkedin,s.portfolio,item.admin_note]; });
  const body = [headers, ...rows].map((row) => row.map(csv).join(",")).join("\r\n");
  return new Response(`\ufeff${body}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="planet-infinity-applications-${new Date().toISOString().slice(0,10)}.csv"`, "cache-control": "no-store" } });
}
