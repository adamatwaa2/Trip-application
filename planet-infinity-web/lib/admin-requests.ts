import "server-only";

import { createClient } from "@/lib/supabase/server";

export const requestStatuses = ["pending", "accepted", "rejected", "confirmed"] as const;
export type RequestStatus = (typeof requestStatuses)[number];
export type AdminRequest = {
  id: string; request_number: string; request_type: "trip" | "event" | "application";
  status: RequestStatus; subject_slug: string | null; subject_title: string | null;
  external_subject_id: string | null; guest_count: number | null; selections: Record<string, unknown>;
  notes: string | null; admin_note: string | null; travel_or_event_at: string | null;
  payment_method: "instapay" | "vodafone_cash" | null; payment_proof_path: string | null;
  created_at: string; updated_at: string;
  customer: { id: string; full_name: string; email: string; phone: string | null } | null;
  trip: { title: string } | null; event: { title: string } | null;
  booking: { id: string; booking_number: string } | null;
};
export type RequestHistoryItem = { id: string; from_status: RequestStatus | null; to_status: RequestStatus; note: string | null; changed_by: string | null; created_at: string };
export type RequestFilters = { type?: string; status?: string; query?: string; page?: string };

const requestColumns = "id, request_number, request_type, status, subject_slug, subject_title, external_subject_id, guest_count, selections, notes, admin_note, travel_or_event_at, payment_method, payment_proof_path, created_at, updated_at, customer:customers(id, full_name, email, phone), trip:trips(title), event:events(title), booking:bookings(id, booking_number)";

function escapeFilterValue(value: string): string { return value.replace(/[,%()]/g, " ").trim().slice(0, 80); }
function asRequest(value: unknown): AdminRequest { return value as AdminRequest; }

export async function getRequests(filters: RequestFilters = {}) {
  const supabase = await createClient();
  const page = Math.max(1, Number(filters.page) || 1); const pageSize = 30;
  let query = supabase.from("requests").select(requestColumns, { count: "exact" }).is("archived_at", null).order("created_at", { ascending: false });
  if (filters.type && ["trip", "event", "application"].includes(filters.type)) query = query.eq("request_type", filters.type);
  if (filters.status && requestStatuses.includes(filters.status as RequestStatus)) query = query.eq("status", filters.status);
  const search = escapeFilterValue(filters.query ?? "");
  if (search) query = query.or(`subject_title.ilike.%${search}%,request_number.ilike.%${search}%`);
  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  const requests = (data ?? []).map(asRequest);
  const customerSearch = search
    ? requests.filter((item) => `${item.customer?.full_name ?? ""} ${item.customer?.email ?? ""}`.toLowerCase().includes(search.toLowerCase()))
    : requests;
  return { requests: customerSearch, count: count ?? 0, page, pageSize, error: error ? "Requests could not be loaded." : null };
}

export async function getRequest(id: string): Promise<AdminRequest | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("requests").select(requestColumns).eq("id", id).maybeSingle();
  return data ? asRequest(data) : null;
}

export async function getRequestHistory(requestId: string): Promise<RequestHistoryItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("request_status_history").select("id, from_status, to_status, note, changed_by, created_at").eq("request_id", requestId).order("created_at", { ascending: false });
  return (data ?? []) as RequestHistoryItem[];
}

export async function getPaymentProofUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 10 * 60);
  return error ? null : data.signedUrl;
}

export async function getOverview() {
  const supabase = await createClient();
  const countFor = async (table: "requests" | "bookings", status?: string) => {
    let query = supabase.from(table).select("id", { count: "exact", head: true });
    if (table === "requests") query = query.is("archived_at", null);
    if (status) query = query.eq("status", status);
    const { count } = await query; return count ?? 0;
  };
  const [all, pending, accepted, bookings] = await Promise.all([countFor("requests"), countFor("requests", "pending"), countFor("requests", "accepted"), countFor("bookings")]);
  return { all, pending, accepted, bookings };
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
export function requestTypeLabel(type: AdminRequest["request_type"]): string { return type === "application" ? "Application" : `${type[0].toUpperCase()}${type.slice(1)} request`; }
export function requestSubject(request: AdminRequest): string { return request.trip?.title ?? request.event?.title ?? request.subject_title ?? "Planet Infinity application"; }
