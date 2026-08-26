import type { NextRequest } from "next/server";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { isWhatsAppConfigured } from "@/lib/whatsapp/config";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";

type OutboxRow = {
  id: string;
  channel: "whatsapp" | "email";
  event_type: "booking_confirmation";
  recipient: string;
  payload: Record<string, unknown>;
};

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  if (!isSupabaseServiceConfigured() || !isWhatsAppConfigured()) {
    return Response.json({ ok: false, error: "Notification providers are not configured." }, { status: 503 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("claim_notification_outbox", { p_limit: 10 });
  if (error) return Response.json({ ok: false, error: "The notification queue could not be claimed." }, { status: 500 });

  let sent = 0;
  let deferred = 0;
  for (const row of (data ?? []) as OutboxRow[]) {
    try {
      if (row.channel !== "whatsapp" || row.event_type !== "booking_confirmation") throw new Error("Only Booking Confirmation WhatsApp messages are enabled.");
      const storagePath = String(row.payload.storage_path ?? "");
      const { data: signed, error: signError } = await supabase.storage
        .from("booking-confirmations")
        .createSignedUrl(storagePath, 60 * 60);
      if (signError || !signed?.signedUrl) throw new Error("The confirmation PDF link could not be created.");
      const messageId = await sendWhatsAppTemplate({
        recipient: row.recipient,
        payload: row.payload,
        documentUrl: signed.signedUrl,
      });
      await supabase.rpc("complete_notification_outbox", {
        p_id: row.id,
        p_sent: true,
        p_external_message_id: messageId,
        p_error: null,
      });
      sent += 1;
    } catch (sendError) {
      await supabase.rpc("complete_notification_outbox", {
        p_id: row.id,
        p_sent: false,
        p_external_message_id: null,
        p_error: sendError instanceof Error ? sendError.message : "Unknown notification error",
      });
      deferred += 1;
    }
  }

  return Response.json({ ok: true, claimed: (data ?? []).length, sent, deferred });
}
