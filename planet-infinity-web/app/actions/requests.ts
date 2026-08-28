"use server";

import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  createServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

const REQUEST_STATUSES = ["pending", "accepted", "rejected", "confirmed"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TEXT = 2000;
const PAYMENT_PROOF_BUCKET = "payment-proofs";
const PAYMENT_PROOF_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_PAYMENT_PROOF_SIZE = 10 * 1024 * 1024;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type PublicRequestInput = {
  requestType: "trip" | "event" | "application";
  productId?: string;
  externalSubjectId?: string;
  subjectSlug?: string;
  subjectTitle?: string;
  fullName: string;
  email: string;
  phone?: string;
  guestCount?: number;
  scheduledAt?: string;
  selections?: Record<string, unknown>;
  notes?: string;
  termsAccepted: boolean;
  whatsappOptIn?: boolean;
};

export type RequestActionResult =
  | { ok: true; requestNumber: string }
  | { ok: false; error: string };

export type PublicTripBookingInput = Omit<
  PublicRequestInput,
  "requestType" | "externalSubjectId" | "subjectSlug" | "subjectTitle" | "scheduledAt"
> & { productId: string };

export type TripBookingActionResult =
  | { ok: true; bookingNumber: string }
  | { ok: false; error: string };

export type PaymentProofUploadResult =
  | { ok: true; bucket: string; path: string; token: string }
  | { ok: false; error: string };

export async function choosePaidBookingSeats(input: { paymentToken: string; seats: number[] }): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!UUID.test(input.paymentToken) || !Array.isArray(input.seats) || input.seats.some((seat) => !Number.isInteger(seat))) {
    return { ok: false, error: "Choose valid seats." };
  }
  if (!isSupabaseServiceConfigured()) return { ok: false, error: "Seat selection is not configured yet." };
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("assign_paid_booking_seats", { p_payment_token: input.paymentToken, p_seats: input.seats });
  if (!error) return { ok: true };
  if (error.message.includes("after full payment")) return { ok: false, error: "Seat selection unlocks after full payment is recorded." };
  if (error.message.includes("just taken")) return { ok: false, error: "One of those seats was just taken. Choose another seat." };
  return { ok: false, error: "We could not save those seats. Please try again." };
}

function cleanText(value: string | undefined, limit = MAX_TEXT): string {
  return (value ?? "").trim().slice(0, limit);
}

function policySlugs(_type: PublicRequestInput["requestType"], accepted: boolean): string[] {
  if (!accepted) return [];
  return [
    "booking",
    "cancellation",
    "refund",
    "payment",
    "terms",
    "etiquette",
    "privacy",
  ];
}

function publicError(message: string | undefined): string {
  if (!message) return "We could not save your request. Please try again.";
  if (message.includes("seats was just taken") || message.includes("seats were just taken") || message.includes("seats was") || message.includes("those seats was") || message.includes("those seats were") || message.includes("seat was just taken")) return "One of those seats was just taken. Please choose again.";
  if (message.includes("Choose one seat for every guest") || message.includes("Choose one valid seat for every guest")) return "Choose one seat for every guest.";
  if (message.includes("requested seats are no longer available")) return "One or more seats are no longer available. Please choose again.";
  if (message.includes("Choose an available seat")) return "Please choose an available seat.";
  if (message.includes("selected seat is invalid")) return "That seat is not available for this trip.";
  if (message.includes("requires an application")) return "This listing requires an application first.";
  if (message.includes("application is unavailable")) return "This application is no longer available.";
  if (message.includes("Required policies are not published")) return "Bookings are paused while the final policies are being published.";
  if (message.includes("Please wait before submitting")) return "Please wait a few minutes before sending the same request again.";
  if (message.includes("WhatsApp number is required")) return "Enter your WhatsApp number or turn off WhatsApp updates.";
  if (message.includes("Payment proof is required")) return "Upload the payment receipt before submitting.";
  if (message.includes("required trip question")) return "Answer all required trip questions.";
  return "We could not save your request. Please try again.";
}

function publicBookingError(message: string | undefined): string {
  if (!message) return "We could not complete your booking. Please try again.";
  if (message.includes("Please wait before submitting")) return "This booking was already received. Wait a few minutes before trying again.";
  if (message.includes("does not have enough availability")) return "There are not enough places left for this booking.";
  if (message.includes("Payment receipt upload is missing")) return "The receipt upload is missing. Upload it again, then complete the booking.";
  if (message.includes("Payment proof is required") || message.includes("Invalid payment proof")) return "Upload a valid payment receipt before completing the booking.";
  if (message.includes("required trip question")) return "Answer all required trip questions.";
  if (message.includes("requires an application")) return "This trip requires an application before booking.";
  if (message.includes("Required policies are not published")) return "Bookings are paused while the final policies are being published.";
  if (message.includes("WhatsApp number is required")) return "Enter your WhatsApp number or turn off WhatsApp updates.";
  if (message.includes("seat was just taken") || message.includes("seats was just taken")) return "One of those seats was just taken. Please choose again.";
  if (message.includes("Choose one seat for every guest")) return "Choose one seat for every guest.";
  return "We could not complete your booking. Please try again.";
}

function validatePublicRequest(input: PublicRequestInput): string | null {
  if (cleanText(input.fullName, 120).length < 2) return "Please enter your full name.";
  const email = cleanText(input.email, 254);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Please enter a valid email address.";
  if (!input.termsAccepted) return "Please accept the policies before submitting.";
  if (input.guestCount !== undefined && (!Number.isInteger(input.guestCount) || input.guestCount < 1)) {
    return "Please enter a valid guest count.";
  }
  if (input.requestType !== "application" && !cleanText(input.subjectTitle, 160)) {
    return "This request is missing its trip or event reference.";
  }
  try {
    if (JSON.stringify(input.selections ?? {}).length > 20_000) return "The selection details are too large.";
  } catch {
    return "The selection details are invalid.";
  }
  return null;
}

export async function createPaymentProofUploadTarget(input: {
  tripId: string;
  mimeType: string;
  size: number;
}): Promise<PaymentProofUploadResult> {
  if (!UUID.test(input.tripId)) return { ok: false, error: "This trip is invalid." };
  const extension = PAYMENT_PROOF_TYPES[input.mimeType];
  if (!extension || !Number.isInteger(input.size) || input.size < 1 || input.size > MAX_PAYMENT_PROOF_SIZE) {
    return { ok: false, error: "Upload a JPG, PNG, or WebP image up to 10 MB." };
  }
  if (!isSupabaseServiceConfigured()) {
    return { ok: false, error: "Secure receipt upload is not configured yet." };
  }

  const supabase = createServiceClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("id")
    .eq("id", input.tripId)
    .eq("is_published", true)
    .eq("payment_proof_required", true)
    .maybeSingle();
  if (!trip) return { ok: false, error: "Receipt upload is not available for this trip." };

  const month = new Date().toISOString().slice(0, 7);
  const path = `pending/${month}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data?.token) return { ok: false, error: "The secure receipt upload could not start." };
  return { ok: true, bucket: PAYMENT_PROOF_BUCKET, path, token: data.token };
}

/** Public intake reaches only the narrow, validated database RPC. */
export async function submitPublicRequest(input: PublicRequestInput): Promise<RequestActionResult> {
  const validationError = validatePublicRequest(input);
  if (validationError) return { ok: false, error: validationError };
  if (!isSupabaseConfigured()) return { ok: false, error: "Request service is not configured yet." };

  const scheduledAt = cleanText(input.scheduledAt, 40);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_public_request", {
    p_request_type: input.requestType,
    p_product_id: UUID.test(input.productId ?? "") ? input.productId : null,
    p_external_subject_id: cleanText(input.externalSubjectId, 120) || null,
    p_subject_slug: cleanText(input.subjectSlug, 160) || null,
    p_subject_title: cleanText(input.subjectTitle, 160) || null,
    p_full_name: cleanText(input.fullName, 120),
    p_email: cleanText(input.email, 254),
    p_phone: cleanText(input.phone, 40) || null,
    p_guest_count: input.guestCount ?? null,
    p_scheduled_at: scheduledAt || null,
    p_selections: input.selections ?? {},
    p_notes: cleanText(input.notes) || null,
    p_policy_slugs: policySlugs(input.requestType, input.termsAccepted),
    p_whatsapp_opt_in: Boolean(input.whatsappOptIn),
  });

  if (error || !data?.[0]?.request_number) {
    return { ok: false, error: publicError(error?.message) };
  }
  return { ok: true, requestNumber: data[0].request_number };
}

/** Creates the real booking immediately; its uploaded receipt remains pending admin verification. */
export async function submitPublicTripBooking(input: PublicTripBookingInput): Promise<TripBookingActionResult> {
  const validationError = validatePublicRequest({
    ...input,
    requestType: "trip",
    subjectTitle: "Direct trip booking",
  });
  if (validationError) return { ok: false, error: validationError };
  if (!UUID.test(input.productId)) return { ok: false, error: "This trip is invalid." };
  if (!isSupabaseConfigured()) return { ok: false, error: "Booking service is not configured yet." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_public_trip_booking", {
    p_trip_id: input.productId,
    p_full_name: cleanText(input.fullName, 120),
    p_email: cleanText(input.email, 254),
    p_phone: cleanText(input.phone, 40) || null,
    p_guest_count: input.guestCount ?? 1,
    p_selections: input.selections ?? {},
    p_notes: cleanText(input.notes) || null,
    p_policy_slugs: policySlugs("trip", input.termsAccepted),
    p_whatsapp_opt_in: Boolean(input.whatsappOptIn),
  });

  if (error || !data?.[0]?.booking_number) {
    return { ok: false, error: publicBookingError(error?.message) };
  }
  return { ok: true, bookingNumber: data[0].booking_number };
}

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  note: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!UUID.test(requestId)) return { ok: false, error: "Invalid request reference." };
  if (!REQUEST_STATUSES.includes(status)) return { ok: false, error: "Invalid request status." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_request_status", {
    p_request_id: requestId,
    p_status: status,
    p_note: cleanText(note) || null,
  });
  return error ? { ok: false, error: "The status could not be updated." } : { ok: true };
}

export async function convertRequestToBooking(
  requestId: string,
  totalAmount: number,
  note: string
): Promise<{ ok: true; bookingNumber: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (!UUID.test(requestId) || !Number.isFinite(totalAmount) || totalAmount < 0) {
    return { ok: false, error: "Enter a valid request and total amount." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("convert_request_to_booking", {
    p_request_id: requestId,
    p_total_amount: totalAmount,
    p_note: cleanText(note) || null,
  });
  if (error || !data?.[0]?.booking_number) return { ok: false, error: "The booking could not be created." };
  return { ok: true, bookingNumber: data[0].booking_number };
}
