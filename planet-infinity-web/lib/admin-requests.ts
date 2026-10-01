import "server-only";

import { createClient } from "@/lib/supabase/server";
import { careerApplicationRole, isCareerApplication } from "@/lib/request-display";
import { getRecruitmentRole } from "@/content/recruitment";

export const requestStatuses = ["pending", "accepted", "rejected", "confirmed"] as const;
export type RequestStatus = (typeof requestStatuses)[number];
export type AdminRequest = {
  id: string; request_number: string; request_type: "trip" | "event" | "application";
  status: RequestStatus; subject_slug: string | null; subject_title: string | null;
  external_subject_id: string | null; guest_count: number | null; selections: Record<string, unknown>;
  notes: string | null; admin_note: string | null; travel_or_event_at: string | null;
  payment_method: "instapay" | "vodafone_cash" | null; payment_proof_path: string | null;
  application_status: string | null; application_category: string | null; application_world: string | null;
  application_role: string | null; application_country: string | null; application_city: string | null;
  application_egypt_based: boolean | null; application_work_mode: string | null;
  created_at: string; updated_at: string;
  customer: { id: string; full_name: string; email: string; phone: string | null } | null;
  trip: { title: string } | null; event: { title: string } | null;
  booking: { id: string; booking_number: string } | null;
};
export type RequestHistoryItem = { id: string; from_status: RequestStatus | null; to_status: RequestStatus; note: string | null; changed_by: string | null; created_at: string };
export type RequestFilters = { type?: string; status?: string; query?: string; page?: string };

const requestColumns = "id, request_number, request_type, status, subject_slug, subject_title, external_subject_id, guest_count, selections, notes, admin_note, travel_or_event_at, payment_method, payment_proof_path, application_status, application_category, application_world, application_role, application_country, application_city, application_egypt_based, application_work_mode, created_at, updated_at, customer:customers(id, full_name, email, phone), trip:trips(title), event:events(title), booking:bookings(id, booking_number)";

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

export async function getPrivateRequestPhotoUrls(value: unknown): Promise<Array<{ name: string; url: string }>> {
  if (!Array.isArray(value)) return [];
  const photos = value.slice(0, 2).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const photo = entry as { path?: unknown; fileName?: unknown };
    if (typeof photo.path !== "string" || !/^(?:careers\/\d{4}-\d{2}|applications\/[0-9a-f-]{36}\/\d{4}-\d{2})\/[0-9a-f-]+\.(jpg|png|webp)$/i.test(photo.path)) return [];
    return [{ path: photo.path, name: typeof photo.fileName === "string" ? photo.fileName.slice(0, 120) : "Candidate photo" }];
  });
  const supabase = await createClient();
  const signed = await Promise.all(photos.map(async (photo) => {
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(photo.path, 10 * 60);
    return error || !data?.signedUrl ? null : { name: photo.name, url: data.signedUrl };
  }));
  return signed.filter((photo): photo is { name: string; url: string } => photo !== null);
}

export const getCareerPhotoUrls = getPrivateRequestPhotoUrls;

export async function getRecruitmentUploadUrls(value: unknown): Promise<Array<{ kind: string; name: string; url: string }>> {
  if (!Array.isArray(value)) return [];
  const uploads = value.slice(0, 1).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const file = entry as { kind?: unknown; path?: unknown; fileName?: unknown };
    if (typeof file.path !== "string" || !/^recruitment\/\d{4}-\d{2}\/[0-9a-f-]{36}\/[0-9a-f-]+\.(jpg|png|webp)$/i.test(file.path)) return [];
    return [{ path: file.path, kind: typeof file.kind === "string" ? file.kind : "file", name: typeof file.fileName === "string" ? file.fileName.slice(0, 120) : "Application file" }];
  });
  const supabase = await createClient();
  const signed = await Promise.all(uploads.map(async (file) => { const { data, error } = await supabase.storage.from("recruitment-files").createSignedUrl(file.path, 10 * 60); return error || !data?.signedUrl ? null : { kind: file.kind, name: file.name, url: data.signedUrl }; }));
  return signed.filter((item): item is { kind: string; name: string; url: string } => Boolean(item));
}

export async function getOverview() {
  const supabase = await createClient();
  const countFor = async (table: "requests" | "bookings", status?: string) => {
    let query = supabase.from(table).select("id", { count: "exact", head: true });
    query = query.is("archived_at", null);
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
export function requestSubject(request: AdminRequest): string {
  if (isCareerApplication(request)) {
    const configuredRole = getRecruitmentRole(request.application_category ?? "", request.application_role ?? "");
    if (configuredRole) return `Careers · ${configuredRole.title}`;
    const role = careerApplicationRole(request.selections);
    return role ? `Careers · ${role}` : "Careers application";
  }
  return request.trip?.title ?? request.event?.title ?? request.subject_title ?? "Planet Infinity application";
}

export type ApplicationFilters = { query?: string; category?: string; world?: string; role?: string; country?: string; location?: string; status?: string; page?: string };
export async function getApplications(filters: ApplicationFilters = {}, all = false) {
  const supabase = await createClient();
  const page = Math.max(1, Number(filters.page) || 1); const pageSize = 40;
  let query = supabase.from("requests").select(requestColumns, { count: "exact" }).eq("request_type", "application").is("archived_at", null).order("created_at", { ascending: false });
  if (filters.category) query = query.eq("application_category", filters.category);
  if (filters.world) query = query.eq("application_world", filters.world);
  if (filters.role) query = query.eq("application_role", filters.role);
  if (filters.country) query = query.ilike("application_country", `%${escapeFilterValue(filters.country)}%`);
  if (filters.status) query = query.eq("application_status", filters.status);
  if (filters.location === "egypt") query = query.eq("application_egypt_based", true);
  if (filters.location === "remote") query = query.eq("application_work_mode", "Remote");
  const search = escapeFilterValue(filters.query ?? "");
  if (search) query = query.or(`request_number.ilike.%${search}%,application_role.ilike.%${search}%,contact_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
  const { data, error, count } = all ? await query.limit(5000) : await query.range((page - 1) * pageSize, page * pageSize - 1);
  const applications = (data ?? []).map(asRequest);
  return { applications, count: count ?? applications.length, page, pageSize, error: error ? "Applications could not be loaded." : null };
}
