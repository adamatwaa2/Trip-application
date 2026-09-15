import "server-only";

import { DEFAULT_CAREERS_FORM_FIELDS } from "@/content/careers-form";
import { normaliseBookingFormFields, type BookingFormField } from "@/lib/booking-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function getCareersFormFields(): Promise<BookingFormField[]> {
  if (!isSupabaseConfigured()) return DEFAULT_CAREERS_FORM_FIELDS;
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "careers_form_fields").maybeSingle();
  if (!data?.value) return DEFAULT_CAREERS_FORM_FIELDS;
  try {
    return normaliseBookingFormFields(JSON.parse(data.value)) ?? DEFAULT_CAREERS_FORM_FIELDS;
  } catch {
    return DEFAULT_CAREERS_FORM_FIELDS;
  }
}
