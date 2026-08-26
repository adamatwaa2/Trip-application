"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import {
  catalogMediaExtension,
  isSafeCatalogUrl,
  type CatalogMediaKind,
  validateCatalogMedia,
} from "@/lib/catalog-media";
import { createClient } from "@/lib/supabase/server";
import {
  normaliseBookingFormFields,
  type BookingFormField,
} from "@/lib/booking-form";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const paymentMethods = ["cash", "bank_transfer", "instapay", "vodafone_cash", "card_terminal", "other"] as const;
const paymentStatuses = ["pending", "recorded", "void"] as const;
const bookingModes = ["booking", "request", "application"] as const;
const CATALOG_MEDIA_BUCKET = "catalog-media";

function text(value: string, max = 2000) { return value.trim().slice(0, max); }
export type ActionResult = { ok: true } | { ok: false; error: string };

type CatalogMediaInput = {
  hero?: string;
  heroAlt?: string;
  gallery?: { src: string; alt: string }[];
  video?: string;
};

type CatalogItemInput = {
  id?: string;
  kind: "trips" | "events";
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  destinationOrCategory: string;
  durationOrVenue: string;
  meetingPoint: string;
  date?: string;
  endDate?: string;
  departurePoint: string;
  returnPoint: string;
  packageLabel: string;
  accommodation: string;
  transportation: string;
  importantInformation: string[];
  price?: number;
  capacity?: number;
  bookingMode: (typeof bookingModes)[number];
  applicationRequired: boolean;
  seatSelectionEnabled: boolean;
  seatConfig?: unknown;
  bookingFormFields: BookingFormField[];
  paymentProofRequired: boolean;
  inclusions: string[];
  exclusions: string[];
  media: CatalogMediaInput;
  documentUrl: string;
  documentLabel: string;
  published: boolean;
  featured: boolean;
};

type UploadTargetResult =
  | { ok: true; bucket: string; path: string; token: string; publicUrl: string }
  | { ok: false; error: string };

function textList(values: string[]) {
  return values
    .map((value) => text(value, 240))
    .filter(Boolean)
    .slice(0, 80);
}

function normaliseMedia(media: CatalogMediaInput): CatalogMediaInput | null {
  const hero = text(media.hero ?? "", 2000);
  const video = text(media.video ?? "", 2000);
  const gallery = (media.gallery ?? [])
    .map((image) => ({
      src: text(image.src ?? "", 2000),
      alt: text(image.alt ?? "", 240),
    }))
    .filter((image) => image.src)
    .slice(0, 20);

  if (
    !isSafeCatalogUrl(hero) ||
    !isSafeCatalogUrl(video) ||
    gallery.some((image) => !isSafeCatalogUrl(image.src))
  ) {
    return null;
  }

  return {
    ...(hero ? { hero, heroAlt: text(media.heroAlt ?? "", 240) } : {}),
    ...(gallery.length ? { gallery } : {}),
    ...(video ? { video } : {}),
  };
}

export async function createCatalogUploadTarget(input: {
  kind: CatalogMediaKind;
  mimeType: string;
  size: number;
}): Promise<UploadTargetResult> {
  const profile = await requireAdmin();
  const validationError = validateCatalogMedia(input.kind, input.mimeType, input.size);
  const extension = catalogMediaExtension(input.mimeType);

  if (validationError || !extension) {
    return { ok: false, error: validationError ?? "That file type is not supported." };
  }

  const supabase = await createClient();
  const month = new Date().toISOString().slice(0, 7);
  const path = `${profile.id}/${input.kind}/${month}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage
    .from(CATALOG_MEDIA_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data?.token) {
    return { ok: false, error: "A secure upload could not be started. Please try again." };
  }

  const { data: publicData } = supabase.storage
    .from(CATALOG_MEDIA_BUCKET)
    .getPublicUrl(path);

  return {
    ok: true,
    bucket: CATALOG_MEDIA_BUCKET,
    path,
    token: data.token,
    publicUrl: publicData.publicUrl,
  };
}

export async function createCatalogItem(input: CatalogItemInput): Promise<ActionResult> {
  await requireAdmin();
  if (
    !text(input.title, 160) ||
    !slugPattern.test(input.slug) ||
    (input.id !== undefined && !uuidPattern.test(input.id)) ||
    !bookingModes.includes(input.bookingMode) ||
    (input.price !== undefined && (!Number.isFinite(input.price) || input.price < 0)) ||
    (input.capacity !== undefined && (!Number.isInteger(input.capacity) || input.capacity < 1))
  ) {
    return { ok: false, error: "Enter a title, a lowercase slug, and valid optional amounts." };
  }

  const media = normaliseMedia(input.media);
  const documentUrl = text(input.documentUrl, 2000);
  if (!media || !isSafeCatalogUrl(documentUrl)) {
    return { ok: false, error: "Use valid http or https links for media and documents." };
  }

  let seatConfig: unknown = {};
  if (input.kind === "trips" && input.seatSelectionEnabled) {
    const serialisedSeatConfig = JSON.stringify(input.seatConfig ?? {});
    if (serialisedSeatConfig.length > 20_000) {
      return { ok: false, error: "The seat layout is too large." };
    }
    seatConfig = input.seatConfig ?? {};
  }
  const bookingFormFields = normaliseBookingFormFields(input.bookingFormFields);
  if (input.kind === "trips" && bookingFormFields === null) {
    return { ok: false, error: "Check the custom booking questions and their options." };
  }

  const supabase = await createClient();
  const date = input.date ? new Date(input.date) : null;
  const endDate = input.endDate ? new Date(input.endDate) : null;
  if (input.date && Number.isNaN(date?.getTime())) return { ok: false, error: "Enter a valid date and time." };
  if (input.endDate && Number.isNaN(endDate?.getTime())) return { ok: false, error: "Enter a valid end or return date and time." };
  const shared = {
    title: text(input.title, 160),
    slug: input.slug,
    short_description: text(input.shortDescription, 320),
    description: text(input.description, 12_000),
    price_egp: input.price ?? null,
    capacity: input.capacity ?? null,
    booking_mode: input.bookingMode,
    application_required: input.applicationRequired,
    media,
    inclusions: textList(input.inclusions),
    exclusions: textList(input.exclusions),
    important_information: textList(input.importantInformation),
    document_url: documentUrl || null,
    document_label: documentUrl
      ? text(input.documentLabel, 120) || `${input.kind === "trips" ? "Trip" : "Event"} information PDF`
      : null,
    is_published: input.published,
    is_featured: input.featured,
  };
  const isUpdate = Boolean(input.id);
  const { error } = input.kind === "trips"
    ? isUpdate
      ? await supabase.from("trips").update({
          ...shared,
          destination: text(input.destinationOrCategory, 240) || null,
          duration_label: text(input.durationOrVenue, 160) || null,
          meeting_point: text(input.meetingPoint, 500) || null,
          departure_at: date?.toISOString() ?? null,
          return_at: endDate?.toISOString() ?? null,
          departure_point: text(input.departurePoint, 500) || null,
          return_point: text(input.returnPoint, 500) || null,
          package_label: text(input.packageLabel, 160) || null,
          accommodation: text(input.accommodation, 1000) || null,
          transportation: text(input.transportation, 1000) || null,
          seat_selection_enabled: input.seatSelectionEnabled,
          seat_config: seatConfig,
          booking_form_fields: bookingFormFields ?? [],
          payment_proof_required: input.paymentProofRequired,
        }).eq("id", input.id!)
      : await supabase.from("trips").insert({
          ...shared,
          destination: text(input.destinationOrCategory, 240) || null,
          duration_label: text(input.durationOrVenue, 160) || null,
          meeting_point: text(input.meetingPoint, 500) || null,
          departure_at: date?.toISOString() ?? null,
          return_at: endDate?.toISOString() ?? null,
          departure_point: text(input.departurePoint, 500) || null,
          return_point: text(input.returnPoint, 500) || null,
          package_label: text(input.packageLabel, 160) || null,
          accommodation: text(input.accommodation, 1000) || null,
          transportation: text(input.transportation, 1000) || null,
          seat_selection_enabled: input.seatSelectionEnabled,
          seat_config: seatConfig,
          booking_form_fields: bookingFormFields ?? [],
          payment_proof_required: input.paymentProofRequired,
        })
    : isUpdate
      ? await supabase.from("events").update({
          ...shared,
          category: text(input.destinationOrCategory, 160) || null,
          venue: text(input.durationOrVenue, 500) || null,
          starts_at: date?.toISOString() ?? null,
          ends_at: endDate?.toISOString() ?? null,
        }).eq("id", input.id!)
      : await supabase.from("events").insert({
          ...shared,
          category: text(input.destinationOrCategory, 160) || null,
          venue: text(input.durationOrVenue, 500) || null,
          starts_at: date?.toISOString() ?? null,
          ends_at: endDate?.toISOString() ?? null,
        });
  if (error) return { ok: false, error: "The item could not be saved. The slug may already be in use." };
  revalidatePath(`/admin/${input.kind}`);
  if (input.id) revalidatePath(`/admin/${input.kind}/${input.id}`);
  revalidatePath(input.kind === "trips" ? "/trips" : "/events");
  revalidatePath(input.kind === "trips" ? `/trips/${input.slug}` : `/events/${input.slug}`);
  return { ok: true };
}

export async function recordPayment(input: { bookingId: string; amount: number; method: string; status: string; receivedAt?: string; reference?: string; notes?: string }): Promise<ActionResult> {
  await requireAdmin();
  if (!uuidPattern.test(input.bookingId) || !Number.isFinite(input.amount) || input.amount <= 0 || !paymentMethods.includes(input.method as typeof paymentMethods[number]) || !paymentStatuses.includes(input.status as typeof paymentStatuses[number])) return { ok: false, error: "Enter valid payment details." };
  const receivedAt = input.receivedAt ? new Date(input.receivedAt) : null;
  if (input.receivedAt && Number.isNaN(receivedAt?.getTime())) return { ok: false, error: "Enter a valid payment date." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_manual_payment", { p_booking_id: input.bookingId, p_amount: input.amount, p_method: input.method, p_status: input.status, p_received_at: receivedAt?.toISOString() ?? null, p_reference: text(input.reference ?? "", 200) || null, p_notes: text(input.notes ?? "") || null });
  if (error) return { ok: false, error: "The payment could not be recorded." };
  revalidatePath("/admin/payments"); revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function savePolicy(input: { id: string; body: string; version: string; active: boolean }): Promise<ActionResult> {
  await requireAdmin();
  if (!uuidPattern.test(input.id) || !text(input.version, 80)) return { ok: false, error: "A policy version is required." };
  const supabase = await createClient();
  const { error } = await supabase.from("policies").update({ body: input.body.trim(), version: text(input.version, 80), is_active: input.active }).eq("id", input.id);
  if (error) return { ok: false, error: "The policy could not be saved." };
  revalidatePath("/admin/settings"); revalidatePath("/policies/[slug]", "page");
  return { ok: true };
}
