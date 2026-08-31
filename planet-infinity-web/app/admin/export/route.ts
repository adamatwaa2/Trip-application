import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function xml(value: unknown): string {
  return text(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sheet(name: string, rows: Row[]) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const row = (values: unknown[]) => `<Row>${values.map((value) => `<Cell><Data ss:Type="String">${xml(value)}</Data></Cell>`).join("")}</Row>`;
  return `<Worksheet ss:Name="${xml(name)}"><Table>${row(columns)}${rows.map((item) => row(columns.map((column) => item[column]))).join("")}</Table></Worksheet>`;
}

async function rows(table: string): Promise<Row[]> {
  const supabase = await createClient();
  const result: Row[] = [];
  const pageSize = 1000;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase.from(table).select("*").range(start, start + pageSize - 1);
    if (error) throw new Error(`Could not export ${table}.`);
    const page = (data ?? []) as Row[];
    result.push(...page);
    if (page.length < pageSize) return result;
  }
}

/** Admin-only workbook containing every database-backed area of the website. */
export async function GET() {
  await requireAdmin();
  const [bookings, bookingGuests, bookingDocuments, customers, requests, requestHistory, payments, paymentEvents, trips, seats, events, policies, acceptances, settings, notifications, outbox, intake, team] = await Promise.all([
    rows("bookings"), rows("booking_guests"), rows("booking_documents"), rows("customers"), rows("requests"), rows("request_status_history"),
    rows("payments"), rows("payment_webhook_events"), rows("trips"), rows("trip_seat_reservations"), rows("events"), rows("policies"),
    rows("policy_acceptances"), rows("settings"), rows("admin_notifications"), rows("notification_outbox"), rows("booking_intake_submissions"), rows("admin_users"),
  ]);
  const workbook = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${[
    ["Bookings", bookings], ["Booking guests", bookingGuests], ["Booking documents", bookingDocuments], ["Customers", customers],
    ["Requests", requests], ["Request history", requestHistory], ["Payments", payments], ["Payment events", paymentEvents],
    ["Trips", trips], ["Seat reservations", seats], ["Events", events], ["Policies", policies], ["Policy acceptances", acceptances],
    ["Website settings", settings], ["Notifications", notifications], ["Message outbox", outbox], ["Booking intake", intake], ["Admin team", team],
  ].map(([name, data]) => sheet(name as string, data as Row[])).join("")}</Workbook>`;
  const date = new Date().toISOString().slice(0, 10);
  return new Response(workbook, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="planet-infinity-export-${date}.xml"`,
      "Cache-Control": "private, no-store",
    },
  });
}