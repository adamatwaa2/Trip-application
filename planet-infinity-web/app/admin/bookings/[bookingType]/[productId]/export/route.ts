import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

type RecordValue = Record<string, unknown>;
type BookingFormField = { id?: string; label?: string; options?: { id?: string; label?: string }[] };
const asRecord = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const xml = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
const cell = (value: unknown) => `<Cell><Data ss:Type="String">${xml(value)}</Data></Cell>`;
const worksheet = (name: string, rows: unknown[][]) => `<Worksheet ss:Name="${xml(name)}"><Table>${rows.map((row) => `<Row>${row.map(cell).join("")}</Row>`).join("")}</Table></Worksheet>`;
function answerText(answer: unknown, field?: BookingFormField) {
  if (Array.isArray(answer)) return answer.join(", ");
  if (!answer || typeof answer !== "object") return String(answer ?? "");
  return Object.entries(asRecord(answer)).filter(([, value]) => Number(value) > 0).map(([id, quantity]) => `${field?.options?.find((item) => item.id === id)?.label ?? id} × ${quantity}`).join(", ");
}

export async function GET(_request: Request, { params }: { params: Promise<{ bookingType: string; productId: string }> }) {
  await requireAdmin();
  const { bookingType, productId } = await params;
  if (bookingType !== "trip" && bookingType !== "event") return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const productTable = bookingType === "trip" ? "trips" : "events";
  const productColumn = bookingType === "trip" ? "trip_id" : "event_id";
  const productQuery = bookingType === "trip" ? "title, booking_form_fields" : "title";
  const { data: product } = await supabase.from(productTable).select(productQuery).eq("id", productId).maybeSingle();
  if (!product) return new NextResponse("Not found", { status: 404 });
  const { data: bookings, error } = await supabase.from("bookings").select("id, booking_number, status, total_amount, amount_paid, guest_count, scheduled_at, created_at, selections, notes, customer:customers(full_name, email, phone)").eq("booking_type", bookingType).eq(productColumn, productId).order("created_at", { ascending: false });
  if (error) return new NextResponse("Bookings could not be exported.", { status: 500 });
  const bookingRows = (bookings ?? []) as unknown as Array<RecordValue & { id: string; booking_number: string }>;
  const bookingIds = bookingRows.map((item) => item.id);
  const [guestsResult, paymentsResult, seatsResult] = await Promise.all([
    bookingIds.length ? supabase.from("booking_guests").select("booking_id, full_name, phone, is_primary").in("booking_id", bookingIds) : Promise.resolve({ data: [] }),
    bookingIds.length ? supabase.from("payments").select("booking_id, amount, payment_method, status, reference, received_at, created_at").in("booking_id", bookingIds) : Promise.resolve({ data: [] }),
    bookingIds.length ? supabase.from("trip_seat_reservations").select("booking_id, vehicle_id, seat_number, status").in("booking_id", bookingIds) : Promise.resolve({ data: [] }),
  ]);
  const productRecord = product as unknown as RecordValue;
  const title = String(productRecord.title ?? "Experience");
  const fields = Array.isArray(productRecord.booking_form_fields) ? productRecord.booking_form_fields as BookingFormField[] : [];
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  const summaries: unknown[][] = [["Booking reference", "Customer", "Email", "Mobile / WhatsApp", "Guests", "Status", "Total EGP", "Paid EGP", "Remaining EGP", "Scheduled", "Booked at", "Notes"]];
  const guestRows: unknown[][] = [["Booking reference", "Guest name", "Mobile / WhatsApp", "Primary guest"]];
  const paymentRows: unknown[][] = [["Booking reference", "Amount EGP", "Method", "Status", "Transfer / receipt reference", "Recorded at"]];
  const seatRows: unknown[][] = [["Booking reference", "Vehicle", "Seat", "Reservation status"]];
  const answerRows: unknown[][] = [["Booking reference", "Question", "Answer"]];
  for (const booking of bookingRows) {
    const customer = asRecord(booking.customer); const total = Number(booking.total_amount) || 0; const paid = Number(booking.amount_paid) || 0;
    summaries.push([booking.booking_number, customer.full_name, customer.email, customer.phone, booking.guest_count, booking.status, total, paid, Math.max(0, total - paid), booking.scheduled_at, booking.created_at, booking.notes]);
    const selections = asRecord(booking.selections); const answers = asRecord(selections.customAnswers);
    for (const [fieldId, answer] of Object.entries(answers)) { const field = fieldById.get(fieldId); answerRows.push([booking.booking_number, field?.label ?? fieldId, answerText(answer, field)]); }
    for (const response of Array.isArray(selections.customResponses) ? selections.customResponses : []) { const item = asRecord(response); if (typeof item.label === "string") answerRows.push([booking.booking_number, item.label, answerText(item.answer)]); }
  }
  const referenceById = new Map(bookingRows.map((booking) => [booking.id, booking.booking_number]));
  for (const item of ((guestsResult.data ?? []) as Array<RecordValue>)) guestRows.push([referenceById.get(String(item.booking_id)), item.full_name, item.phone, item.is_primary ? "Yes" : ""]);
  for (const item of ((paymentsResult.data ?? []) as Array<RecordValue>)) paymentRows.push([referenceById.get(String(item.booking_id)), item.amount, item.payment_method, item.status, item.reference, item.received_at ?? item.created_at]);
  for (const item of ((seatsResult.data ?? []) as Array<RecordValue>)) seatRows.push([referenceById.get(String(item.booking_id)), item.vehicle_id, item.seat_number, item.status]);
  const workbook = `<?xml version="1.0" encoding="UTF-8"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${worksheet("Bookings", summaries)}${worksheet("Guests", guestRows)}${worksheet("Payments", paymentRows)}${worksheet("Seats", seatRows)}${worksheet("Questions", answerRows)}</Workbook>`;
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "experience"}-bookings.xls`;
  return new NextResponse(workbook, { headers: { "Content-Type": "application/vnd.ms-excel; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
}
