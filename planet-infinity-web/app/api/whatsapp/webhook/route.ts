import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";

function signatureIsValid(raw: string, received: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !received?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const actual = received.slice(7);
  if (!/^[0-9a-f]{64}$/i.test(actual)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (
    params.get("hub.mode") === "subscribe" &&
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
    params.get("hub.verify_token") === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseServiceConfigured()) return new Response("Not configured", { status: 503 });
  const raw = await request.text();
  if (raw.length > 1_000_000) return new Response("Payload too large", { status: 413 });
  if (!signatureIsValid(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(raw) as {
    entry?: { changes?: { value?: { statuses?: { id?: string; status?: string; timestamp?: string; errors?: { title?: string; message?: string }[] }[] } }[] }[];
  };
  const statuses = (body.entry ?? []).flatMap((entry) =>
    (entry.changes ?? []).flatMap((change) => change.value?.statuses ?? []),
  );
  const supabase = createServiceClient();
  for (const status of statuses) {
    if (!status.id || !["sent", "delivered", "read", "failed"].includes(status.status ?? "")) continue;
    const statusAt = status.timestamp && /^\d+$/.test(status.timestamp)
      ? new Date(Number(status.timestamp) * 1000).toISOString()
      : new Date().toISOString();
    await supabase.rpc("record_whatsapp_delivery_status", {
      p_external_message_id: status.id,
      p_status: status.status,
      p_status_at: statusAt,
      p_error: status.errors?.map((error) => error.title || error.message).filter(Boolean).join("; ") || null,
    });
  }
  return new Response("OK", { status: 200 });
}
