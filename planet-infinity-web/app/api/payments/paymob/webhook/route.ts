import type { NextRequest } from "next/server";
import { getPaymobConfig } from "@/lib/paymob/config";
import { verifyPaymobTransactionHmac } from "@/lib/paymob/hmac";
import { createServiceClient } from "@/lib/supabase/service";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 1_000_000) return new Response("Payload too large", { status: 413 });

  const body = (await request.json().catch(() => null)) as UnknownRecord | null;
  const object = record(body?.obj);
  const receivedHmac = request.nextUrl.searchParams.get("hmac") || "";
  if (!body || !Object.keys(object).length) return new Response("Invalid payload", { status: 400 });

  const config = getPaymobConfig();
  if (!verifyPaymobTransactionHmac(object, receivedHmac, config.hmacSecret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  if (Number(object.integration_id) !== config.cardIntegrationId) {
    return new Response("Ignored integration", { status: 202 });
  }

  const order = record(object.order);
  const transactionId = String(object.id || "");
  const orderId = String(order.id || "");
  const merchantReference = String(order.merchant_order_id || order.special_reference || "");
  const amount = Number(object.amount_cents) / 100;
  const currency = String(object.currency || "");
  if (!transactionId || !orderId || !Number.isFinite(amount) || amount <= 0) {
    return new Response("Invalid transaction", { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("process_paymob_transaction", {
    p_transaction_id: transactionId,
    p_order_id: orderId,
    p_merchant_reference: merchantReference || null,
    p_amount: amount,
    p_currency: currency,
    p_success: object.success === true,
    p_pending: object.pending === true,
    p_payload: body,
  });
  if (error) return new Response("Processing failed", { status: 500 });
  return new Response("OK", { status: 200 });
}
