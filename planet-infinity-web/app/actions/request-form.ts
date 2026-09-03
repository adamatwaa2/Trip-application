"use server";

import { normaliseBookingFormFields, type BookingFormField } from "@/lib/booking-form";
import { normaliseRequestFormTheme, type RequestFormTheme } from "@/lib/request-form";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TripRequestForm = {
  fields: BookingFormField[];
  theme: RequestFormTheme;
  title: string | null;
};

/**
 * What the Trip request page should look like for one trip.
 *
 * Published trips only — an unpublished trip must not leak its questions, and
 * an unknown id simply falls back to the standard form rather than erroring.
 */
export async function getTripRequestForm(productId: string): Promise<TripRequestForm> {
  const empty: TripRequestForm = { fields: [], theme: {}, title: null };
  if (!UUID.test(productId) || !isSupabaseConfigured()) return empty;

  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select("title, request_form_fields, request_form_theme")
    .eq("id", productId)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return empty;

  return {
    fields: normaliseBookingFormFields(data.request_form_fields) ?? [],
    theme: normaliseRequestFormTheme(data.request_form_theme),
    title: typeof data.title === "string" ? data.title : null,
  };
}
