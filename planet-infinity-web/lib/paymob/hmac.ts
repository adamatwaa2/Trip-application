import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function stringValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null || value === undefined) return "";
  return String(value);
}

/** Exact Paymob Transaction Processed POST field order. */
export function paymobTransactionHmacSource(object: UnknownRecord): string {
  const order = record(object.order);
  const sourceData = record(object.source_data);
  return [
    object.amount_cents,
    object.created_at,
    object.currency,
    object.error_occured,
    object.has_parent_transaction,
    object.id,
    object.integration_id,
    object.is_3d_secure,
    object.is_auth,
    object.is_capture,
    object.is_refunded,
    object.is_standalone_payment,
    object.is_voided,
    order.id,
    object.owner,
    object.pending,
    sourceData.pan,
    sourceData.sub_type,
    sourceData.type,
    object.success,
  ]
    .map(stringValue)
    .join("");
}

export function verifyPaymobTransactionHmac(
  object: UnknownRecord,
  receivedHmac: string,
  secret: string
): boolean {
  if (!/^[0-9a-f]{128}$/i.test(receivedHmac)) return false;
  const computed = createHmac("sha512", secret)
    .update(paymobTransactionHmacSource(object))
    .digest("hex");
  return timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(receivedHmac.toLowerCase(), "hex")
  );
}

function queryValue(params: URLSearchParams, ...keys: string[]): string {
  for (const key of keys) {
    const value = params.get(key);
    if (value !== null) return value;
  }
  return "";
}

/** Paymob signs redirect query strings using the same 20 fields as callbacks. */
export function paymobRedirectHmacSource(params: URLSearchParams): string {
  return [
    queryValue(params, "amount_cents"),
    queryValue(params, "created_at"),
    queryValue(params, "currency"),
    queryValue(params, "error_occured", "error_occurred"),
    queryValue(params, "has_parent_transaction"),
    queryValue(params, "id"),
    queryValue(params, "integration_id"),
    queryValue(params, "is_3d_secure"),
    queryValue(params, "is_auth"),
    queryValue(params, "is_capture"),
    queryValue(params, "is_refunded"),
    queryValue(params, "is_standalone_payment"),
    queryValue(params, "is_voided"),
    queryValue(params, "order"),
    queryValue(params, "owner"),
    queryValue(params, "pending"),
    queryValue(params, "source_data.pan", "source_data_pan"),
    queryValue(params, "source_data.sub_type", "source_data_sub_type"),
    queryValue(params, "source_data.type", "source_data_type"),
    queryValue(params, "success"),
  ].join("");
}

export function verifyPaymobRedirectHmac(
  params: URLSearchParams,
  receivedHmac: string,
  secret: string,
): boolean {
  if (!/^[0-9a-f]{128}$/i.test(receivedHmac)) return false;
  const computed = createHmac("sha512", secret)
    .update(paymobRedirectHmacSource(params))
    .digest("hex");
  return timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(receivedHmac.toLowerCase(), "hex"),
  );
}
