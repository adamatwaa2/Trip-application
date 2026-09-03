"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Removing things from the admin panel.
 *
 * Two different verbs, deliberately:
 *   cancelBooking   a booking carries money and an audit trail, so it is never
 *                   deleted. It moves to 'cancelled' and its seats go back on
 *                   sale. The record — and every payment on it — stays.
 *   archiveRequest  a request is raw intake. Archiving hides it from the list
 *                   and nothing else, so a mis-click costs nothing: restore
 *                   puts it straight back.
 *
 * Both reach the database only through a SECURITY DEFINER function that
 * re-checks admin rights server-side. The admin role has no direct write grant
 * on these tables.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type RemovalResult = { ok: true; message: string } | { ok: false; error: string };

function note(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim().slice(0, 2000);
  return trimmed === "" ? null : trimmed;
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<RemovalResult> {
  await requireAdmin();
  if (!UUID.test(bookingId)) return { ok: false, error: "Invalid booking reference." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
    p_note: note(reason),
  });
  if (error) return { ok: false, error: "The booking could not be cancelled." };

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin");
  return { ok: true, message: "Booking cancelled. Its seats are back on sale." };
}

export async function archiveRequest(requestId: string, reason?: string): Promise<RemovalResult> {
  await requireAdmin();
  if (!UUID.test(requestId)) return { ok: false, error: "Invalid request reference." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_request", {
    p_request_id: requestId,
    p_note: note(reason),
  });
  if (error) return { ok: false, error: "The request could not be archived." };

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin");
  return { ok: true, message: "Archived. It no longer shows in the requests list." };
}

export async function restoreRequest(requestId: string): Promise<RemovalResult> {
  await requireAdmin();
  if (!UUID.test(requestId)) return { ok: false, error: "Invalid request reference." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_request", { p_request_id: requestId });
  if (error) return { ok: false, error: "The request could not be restored." };

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin");
  return { ok: true, message: "Restored. It is back in the requests list." };
}
