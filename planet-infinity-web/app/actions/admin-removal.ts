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
 *   archiveBooking  the same tidy-up for a booking: it leaves the bookings
 *                   list and nothing else changes, so restoreBooking returns it
 *                   exactly as it was. Cancel first if the seats should be
 *                   resold — hiding a booking does not free its seats.
 *   deleteBooking   irreversible. The booking row and everything attached to
 *                   it (payments, guests, seat holds, documents, notification
 *                   history) is permanently removed via cascade. This exists
 *                   only to purge demo/test data — a real booking should be
 *                   cancelled or archived, never deleted.
 *
 * All of these reach the database only through a SECURITY DEFINER function
 * that re-checks admin rights server-side. The admin role has no direct write
 * grant on these tables.
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

export async function archiveBooking(bookingId: string, reason?: string): Promise<RemovalResult> {
  await requireAdmin();
  if (!UUID.test(bookingId)) return { ok: false, error: "Invalid booking reference." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_booking", {
    p_booking_id: bookingId,
    p_note: note(reason),
  });
  if (error) return { ok: false, error: "The booking could not be removed." };

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin");
  return { ok: true, message: "Removed from the bookings list. Restore brings it back." };
}

/**
 * Permanently deletes a booking — the row, its payments, guests, seat
 * holds, documents and notification history all go, via cascade. There is
 * no undo. Only for purging demo/test bookings.
 */
export async function deleteBooking(bookingId: string, reason?: string): Promise<RemovalResult> {
  await requireAdmin();
  if (!UUID.test(bookingId)) return { ok: false, error: "Invalid booking reference." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_booking", {
    p_booking_id: bookingId,
    p_note: note(reason),
  });
  if (error) return { ok: false, error: "The booking could not be deleted." };

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return { ok: true, message: "Deleted permanently. The booking and its payment history are gone." };
}

export async function restoreBooking(bookingId: string): Promise<RemovalResult> {
  await requireAdmin();
  if (!UUID.test(bookingId)) return { ok: false, error: "Invalid booking reference." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_booking", { p_booking_id: bookingId });
  if (error) return { ok: false, error: "The booking could not be restored." };

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin");
  return { ok: true, message: "Restored. It is back in the bookings list." };
}
