import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RecordValue = Record<string, unknown>;
type BookingFormField = { id?: string; label?: string; options?: { id?: string; label?: string }[] };
const asRecord = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};

function answerText(answer: unknown, field?: BookingFormField) {
  if (Array.isArray(answer)) return answer.map((id) => field?.options?.find((item) => item.id === id)?.label ?? String(id)).join(", ");
  if (!answer || typeof answer !== "object") return String(answer ?? "");
  return Object.entries(asRecord(answer)).filter(([, value]) => Number(value) > 0).map(([id, quantity]) => `${field?.options?.find((item) => item.id === id)?.label ?? id} × ${quantity}`).join(", ");
}

function addSheet(workbook: ExcelJS.Workbook, name: string, headers: string[], rows: unknown[][]) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  const header = sheet.getRow(1);
  header.height = 24;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0C2430" } };
    cell.alignment = { vertical: "middle" };
  });
  sheet.columns.forEach((column, index) => {
    const longest = Math.max(headers[index]?.length ?? 0, ...rows.map((row) => String(row[index] ?? "").length));
    column.width = Math.min(42, Math.max(13, longest + 2));
  });
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F3E9" } }; });
    row.alignment = { vertical: "top", wrapText: true };
  });
  return sheet;
}

export async function GET(request: Request, { params }: { params: Promise<{ bookingType: string; productId: string }> }) {
  await requireAdmin();
  const { bookingType, productId } = await params;
  if (bookingType !== "trip" && bookingType !== "event") return new NextResponse("Not found", { status: 404 });

  const supabase = await createClient();
  const productTable = bookingType === "trip" ? "trips" : "events";
  const productColumn = bookingType === "trip" ? "trip_id" : "event_id";
  const productQuery = bookingType === "trip" ? "title, booking_form_fields" : "title";
  const { data: product } = await supabase.from(productTable).select(productQuery).eq("id", productId).maybeSingle();
  if (!product) return new NextResponse("Not found", { status: 404 });

  const scheduledAts = new URL(request.url).searchParams.getAll("scheduledAt").filter(Boolean);
  let query = supabase.from("bookings").select("id, booking_number, status, total_amount, amount_paid, guest_count, scheduled_at, created_at, selections, notes, customer:customers(full_name, phone)").eq("booking_type", bookingType).eq(productColumn, productId).order("created_at", { ascending: false });
  if (scheduledAts.length) query = query.in("scheduled_at", scheduledAts);
  const { data: bookings, error } = await query;
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
  const summaries: unknown[][] = [];
  const guestRows: unknown[][] = [];
  const paymentRows: unknown[][] = [];
  const seatRows: unknown[][] = [];
  const answerRows: unknown[][] = [];

  for (const booking of bookingRows) {
    const customer = asRecord(booking.customer);
    const total = Number(booking.total_amount) || 0;
    const paid = Number(booking.amount_paid) || 0;
    summaries.push([booking.booking_number, customer.full_name, customer.phone, Number(booking.guest_count) || 0, booking.status, total, paid, Math.max(0, total - paid), booking.scheduled_at, booking.created_at, booking.notes]);
    const selections = asRecord(booking.selections);
    const answers = asRecord(selections.customAnswers);
    for (const [fieldId, answer] of Object.entries(answers)) {
      const field = fieldById.get(fieldId);
      answerRows.push([booking.booking_number, field?.label ?? fieldId, answerText(answer, field)]);
    }
    for (const response of Array.isArray(selections.customResponses) ? selections.customResponses : []) {
      const item = asRecord(response);
      if (typeof item.label === "string") answerRows.push([booking.booking_number, item.label, answerText(item.answer)]);
    }
  }

  const referenceById = new Map(bookingRows.map((booking) => [booking.id, booking.booking_number]));
  for (const item of ((guestsResult.data ?? []) as Array<RecordValue>)) guestRows.push([referenceById.get(String(item.booking_id)), item.full_name, item.phone, item.is_primary ? "Yes" : "No"]);
  for (const item of ((paymentsResult.data ?? []) as Array<RecordValue>)) paymentRows.push([referenceById.get(String(item.booking_id)), Number(item.amount) || 0, item.payment_method, item.status, item.reference, item.received_at ?? item.created_at]);
  for (const item of ((seatsResult.data ?? []) as Array<RecordValue>)) seatRows.push([referenceById.get(String(item.booking_id)), item.vehicle_id, Number(item.seat_number) || 0, item.status]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Planet Infinity";
  workbook.created = new Date();
  workbook.subject = `${title} bookings`;
  const bookingSheet = addSheet(workbook, "Bookings", ["Booking reference", "Customer", "Mobile / WhatsApp", "Guests", "Status", "Total EGP", "Paid EGP", "Remaining EGP", "Departure / start", "Booked at", "Notes"], summaries);
  bookingSheet.getColumn(6).numFmt = "#,##0";
  bookingSheet.getColumn(7).numFmt = "#,##0";
  bookingSheet.getColumn(8).numFmt = "#,##0";
  addSheet(workbook, "Guests", ["Booking reference", "Guest name", "Mobile / WhatsApp", "Primary guest"], guestRows);
  const paymentsSheet = addSheet(workbook, "Payments", ["Booking reference", "Amount EGP", "Method", "Status", "Transfer / receipt reference", "Recorded at"], paymentRows);
  paymentsSheet.getColumn(2).numFmt = "#,##0";
  addSheet(workbook, "Seats", ["Booking reference", "Vehicle", "Seat", "Reservation status"], seatRows);
  addSheet(workbook, "Questions", ["Booking reference", "Question", "Answer"], answerRows);

  const output = await workbook.xlsx.writeBuffer();
  const dateSuffix = scheduledAts[0] ? `-${scheduledAts[0].slice(0, 10)}` : "";
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "experience"}-bookings${dateSuffix}.xlsx`;
  return new NextResponse(Buffer.from(output), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
}
