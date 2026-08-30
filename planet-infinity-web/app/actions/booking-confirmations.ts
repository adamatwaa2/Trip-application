"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import {
  renderBookingConfirmationPdf,
  type BookingConfirmationPdfData,
} from "@/lib/booking-confirmation-pdf";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

type ConfirmationRow = {
  id: string;
  booking_number: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  currency: string;
  scheduled_at: string | null;
  guest_count: number;
  selections: Record<string, unknown>;
  confirmation_ready_at: string | null;
  customer: { full_name: string; email: string; phone: string | null } | null;
  trip: {
    title: string;
    destination: string | null;
    duration_label: string | null;
    return_at: string | null;
    meeting_point: string | null;
    departure_point: string | null;
    return_point: string | null;
    package_label: string | null;
    inclusions: string[];
    exclusions: string[];
    accommodation: string | null;
    transportation: string | null;
    options: unknown;
    booking_form_fields: unknown;
  } | null;
  event: {
    title: string;
    venue: string | null;
    ends_at: string | null;
    inclusions: string[];
    exclusions: string[];
  } | null;
  guests: { full_name: string; is_primary: boolean }[];
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function asSeatNumbers(selections: Record<string, unknown>): number[] {
  const values = Array.isArray(selections.seats)
    ? selections.seats
    : selections.seat !== undefined && selections.seat !== null
      ? [selections.seat]
      : [];
  return values
    .map(asNumber)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function selectedResponse(selections: Record<string, unknown>, id: string): string | null {
  const responses = Array.isArray(selections.customResponses) ? selections.customResponses : [];
  const match = responses.map(asRecord).find((response) => response.id === id);
  const answer = match?.answer;
  if (Array.isArray(answer)) return answer.filter((item): item is string => typeof item === "string").join(" · ") || null;
  return typeof answer === "string" && answer.trim() ? answer.trim() : null;
}

function selectedTripDates(options: unknown, selections: Record<string, unknown>) {
  const selected = asRecord(selections.selected);
  const groups = Array.isArray(options) ? options.map(asRecord) : [];
  for (const group of groups) {
    if (group.kind !== "date" || typeof group.id !== "string") continue;
    const choiceId = selected[group.id];
    const choices = Array.isArray(group.choices) ? group.choices.map(asRecord) : [];
    const choice = choices.find((item) => item.id === choiceId);
    if (choice) return {
      returnAt: typeof choice.returnAt === "string" ? choice.returnAt : null,
      duration: typeof choice.duration === "string" ? choice.duration : null,
    };
  }
  return null;
}

type PaidExtra = { label: string; amount: number };

function normaliseServiceLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function selectedPaidExtras(
  fields: unknown,
  selections: Record<string, unknown>,
  guestCount: number,
): { extras: PaidExtra[]; selectedLabels: string[] } {
  const answers = asRecord(selections.customAnswers);
  const extras: PaidExtra[] = [];
  const selectedLabels: string[] = [];

  for (const field of Array.isArray(fields) ? fields.map(asRecord) : []) {
    const fieldId = typeof field.id === "string" ? field.id : "";
    const fieldType = typeof field.type === "string" ? field.type : "";
    if (!fieldId) continue;
    const options = Array.isArray(field.options) ? field.options.map(asRecord) : [];
    const answer = answers[fieldId];

    if (fieldType === "quantity") {
      const quantities = asRecord(answer);
      for (const option of options) {
        const optionId = typeof option.id === "string" ? option.id : "";
        const label = typeof option.label === "string" ? option.label.trim() : "";
        const quantity = Math.max(0, Math.floor(Number(quantities[optionId]) || 0));
        if (!optionId || !label || quantity < 1) continue;
        selectedLabels.push(label);
        const price = Math.max(0, Number(option.priceEgp) || 0);
        if (price > 0) extras.push({ label: `${label} × ${quantity}`, amount: price * quantity });
      }
      continue;
    }

    const selectedIds = Array.isArray(answer)
      ? answer.filter((value): value is string => typeof value === "string")
      : typeof answer === "string" ? [answer] : [];
    for (const option of options) {
      const optionId = typeof option.id === "string" ? option.id : "";
      const label = typeof option.label === "string" ? option.label.trim() : "";
      if (!optionId || !label || !selectedIds.includes(optionId)) continue;
      selectedLabels.push(label);
      const price = Math.max(0, Number(option.priceEgp) || 0);
      if (price > 0) {
        extras.push({
          label: guestCount > 1 ? `${label} × ${guestCount}` : label,
          amount: price * Math.max(1, guestCount),
        });
      }
    }
  }

  return { extras, selectedLabels };
}

function confirmationData(row: ConfirmationRow): BookingConfirmationPdfData {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const trip = row.trip;
  const event = row.event;
  const amountPaid = Number(row.amount_paid);
  const totalAmount = Number(row.total_amount);
  const selectedDates = selectedTripDates(trip?.options, row.selections ?? {});
  const pickupPoint = selectedResponse(row.selections ?? {}, "pickup-point");
  const paidSelections = selectedPaidExtras(
    trip?.booking_form_fields,
    row.selections ?? {},
    row.guest_count,
  );
  const exclusions = (trip?.exclusions ?? event?.exclusions ?? []).filter((item) => {
    const exclusion = normaliseServiceLabel(item);
    return !paidSelections.selectedLabels.some((selected) => {
      const service = normaliseServiceLabel(selected);
      return service && (exclusion.includes(service) || service.includes(exclusion));
    });
  });

  return {
    bookingNumber: row.booking_number,
    bookingStatus: "Confirmed",
    paymentStatus: amountPaid >= totalAmount ? "Paid in full" : "Partially paid",
    issuedAt: new Date().toISOString(),
    guestName: row.customer?.full_name ?? "Guest",
    guestEmail: row.customer?.email ?? "Not provided",
    guestPhone: row.customer?.phone,
    additionalGuests: (row.guests ?? [])
      .filter((guest) => !guest.is_primary)
      .map((guest) => guest.full_name),
    productType: trip ? "Trip" : "Event",
    productTitle: trip?.title ?? event?.title ?? "Planet Infinity booking",
    destination: trip?.destination ?? event?.venue,
    scheduledAt: row.scheduled_at,
    returnAt: selectedDates?.returnAt ?? trip?.return_at ?? event?.ends_at,
    duration: selectedDates?.duration ?? (trip ? "2 days / 1 night" : undefined),
    meetingPoint: pickupPoint ?? (trip ? "Pickup point not recorded — confirm with Planet Infinity" : event?.venue),
    departurePoint: pickupPoint ?? trip?.departure_point,
    returnPoint: trip?.return_point,
    packageLabel: trip?.package_label,
    inclusions: trip?.inclusions ?? event?.inclusions ?? [],
    exclusions,
    paidExtras: paidSelections.extras,
    accommodation: trip?.accommodation,
    transportation: trip?.transportation,
    seatNumbers: asSeatNumbers(row.selections ?? {}),
    guestCount: row.guest_count,
    totalAmount,
    amountPaid,
    currency: row.currency,
    siteUrl,
  };
}

export async function markBookingServicesConfirmed(
  bookingId: string,
  confirmed: boolean
): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID.test(bookingId)) return { ok: false, error: "Invalid booking reference." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_booking_services_confirmed", {
    p_booking_id: bookingId,
    p_confirmed: confirmed,
  });
  if (error) return { ok: false, error: "The service confirmation could not be updated." };

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return { ok: true, message: confirmed ? "Services confirmed." : "Service confirmation removed." };
}

export async function generateBookingConfirmation(
  bookingId: string
): Promise<ActionResult> {
  await requireAdmin();
  if (!UUID.test(bookingId)) return { ok: false, error: "Invalid booking reference." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, booking_number, status, total_amount, amount_paid, currency,
      scheduled_at, guest_count, selections, confirmation_ready_at,
      customer:customers(full_name, email, phone),
      trip:trips(title, destination, duration_label, return_at, meeting_point,
        departure_point, return_point, package_label, inclusions, exclusions,
        accommodation, transportation, options, booking_form_fields),
      event:events(title, venue, ends_at, inclusions, exclusions),
      guests:booking_guests(full_name, is_primary)
    `)
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "The booking could not be loaded." };
  const row = data as unknown as ConfirmationRow;
  if (!row.confirmation_ready_at) {
    return { ok: false, error: "Record full payment and confirm all services first." };
  }

  const pdf = await renderBookingConfirmationPdf(confirmationData(row));
  const checksum = createHash("sha256").update(pdf).digest("hex");
  const storagePath = `${bookingId}/${randomUUID()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("booking-confirmations")
    .upload(storagePath, pdf, {
      contentType: "application/pdf",
      cacheControl: "private, max-age=0, no-store",
      upsert: false,
    });

  if (uploadError) return { ok: false, error: "The PDF could not be stored." };

  const { error: recordError } = await supabase.rpc("record_booking_confirmation", {
    p_booking_id: bookingId,
    p_storage_path: storagePath,
    p_checksum_sha256: checksum,
  });

  if (recordError) {
    await supabase.storage.from("booking-confirmations").remove([storagePath]);
    return { ok: false, error: "The confirmation could not be issued." };
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return { ok: true, message: "Booking Confirmation generated and queued for opted-in WhatsApp delivery." };
}
