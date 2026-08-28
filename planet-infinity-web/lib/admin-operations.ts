import "server-only";

import type { SeatConfig } from "@/content/trips";
import type { BookingFormField } from "@/lib/booking-form";
import { createClient } from "@/lib/supabase/server";

export type AdminBooking = { id: string; booking_number: string; booking_type: "trip" | "event"; status: "pending" | "confirmed" | "cancelled"; total_amount: number; amount_paid: number; scheduled_at: string | null; created_at: string; payment_token: string; guest_count: number; selections: Record<string, unknown>; notes: string | null; whatsapp_opt_in: boolean; whatsapp_opted_in_at: string | null; services_confirmed_at: string | null; confirmation_ready_at: string | null; confirmation_issued_at: string | null; confirmation_pdf_path: string | null; confirmation_version: number; customer: { id: string; full_name: string; email: string; phone: string | null } | null; trip: { title: string } | null; event: { title: string } | null; request: { id: string; request_number: string } | null; guests?: { full_name: string; is_primary: boolean }[] };
export type AdminPayment = { id: string; amount: number; payment_method: string; status: "pending" | "recorded" | "void"; received_at: string | null; reference: string | null; payment_proof_path: string | null; created_at: string; booking: { id: string; booking_number: string; customer: { full_name: string; email: string } | null } | null };
export type CustomerRequestSummary = {
  id: string;
  request_number: string;
  request_type: "trip" | "event" | "application";
  status: "pending" | "accepted" | "rejected" | "confirmed";
  subject_title: string | null;
  created_at: string;
};
export type CustomerBookingSummary = {
  id: string;
  booking_number: string;
  status: "pending" | "confirmed" | "cancelled";
  total_amount: number;
  amount_paid: number;
  scheduled_at: string | null;
  created_at: string;
  trip: { title: string } | null;
  event: { title: string } | null;
};
export type AdminCustomer = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  requests: CustomerRequestSummary[];
  bookings: CustomerBookingSummary[];
};
export type AdminProduct = {
  id: string;
  slug: string;
  title: string;
  is_published: boolean;
  is_featured: boolean;
  application_required: boolean;
  seat_selection_enabled?: boolean;
  price_egp: number | null;
  departure_at?: string | null;
  starts_at?: string | null;
  updated_at: string;
};
export type AdminProductDetail = Omit<AdminProduct, "updated_at"> & {
  short_description: string;
  description: string;
  destination?: string | null;
  category?: string | null;
  duration_label?: string | null;
  venue?: string | null;
  meeting_point?: string | null;
  return_at?: string | null;
  departure_point?: string | null;
  return_point?: string | null;
  package_label?: string | null;
  accommodation?: string | null;
  transportation?: string | null;
  important_information?: string[] | null;
  ends_at?: string | null;
  capacity: number | null;
  booking_mode: "booking" | "request" | "application";
  seat_config?: SeatConfig | null;
  booking_form_fields?: BookingFormField[] | null;
  payment_proof_required?: boolean;
  song_request_enabled?: boolean;
  media: {
    hero?: string;
    heroAlt?: string;
    gallery?: { src: string; alt: string }[];
    video?: string;
  } | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  document_url: string | null;
  document_label: string | null;
};
export type AdminPolicy = { id: string; slug: string; title: string; version: string; body: string; is_active: boolean; updated_at: string };
export type AdminTeamUser = { id: string; full_name: string | null; role: string; is_active: boolean; created_at: string };

export async function getBookings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bookings").select("id, booking_number, booking_type, status, total_amount, amount_paid, scheduled_at, created_at, payment_token, guest_count, selections, notes, whatsapp_opt_in, whatsapp_opted_in_at, services_confirmed_at, confirmation_ready_at, confirmation_issued_at, confirmation_pdf_path, confirmation_version, customer:customers(id, full_name, email, phone), trip:trips(title), event:events(title), request:requests(id, request_number)").order("created_at", { ascending: false });
  return { items: (data ?? []) as unknown as AdminBooking[], error: error ? "Bookings could not be loaded." : null };
}
export async function getBooking(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("bookings").select("id, booking_number, booking_type, status, total_amount, amount_paid, scheduled_at, created_at, payment_token, guest_count, selections, notes, whatsapp_opt_in, whatsapp_opted_in_at, services_confirmed_at, confirmation_ready_at, confirmation_issued_at, confirmation_pdf_path, confirmation_version, customer:customers(id, full_name, email, phone), trip:trips(title), event:events(title), request:requests(id, request_number), guests:booking_guests(full_name, is_primary), payments(id, amount, payment_method, status, received_at, reference, payment_proof_path, created_at)").eq("id", id).maybeSingle();
  return data as unknown as (AdminBooking & { payments: { id: string; amount: number; payment_method: string; status: string; received_at: string | null; reference: string | null; payment_proof_path: string | null; created_at: string }[] }) | null;
}
export async function getPayments() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("payments").select("id, amount, payment_method, status, received_at, reference, payment_proof_path, created_at, booking:bookings(id, booking_number, customer:customers(full_name, email))").order("created_at", { ascending: false });
  return { items: (data ?? []) as unknown as AdminPayment[], error: error ? "Payments could not be loaded." : null };
}
export async function getCustomers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, email, phone, notes, created_at, requests(id, request_number, request_type, status, subject_title, created_at), bookings(id, booking_number, status, total_amount, amount_paid, scheduled_at, created_at, trip:trips(title), event:events(title))")
    .order("created_at", { ascending: false });
  return { items: (data ?? []) as unknown as AdminCustomer[], error: error ? "Customers could not be loaded." : null };
}

export async function getCustomer(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, email, phone, notes, created_at, requests(id, request_number, request_type, status, subject_title, created_at), bookings(id, booking_number, status, total_amount, amount_paid, scheduled_at, created_at, trip:trips(title), event:events(title))")
    .eq("id", id)
    .maybeSingle();
  return { item: data as unknown as AdminCustomer | null, error: error ? "Customer could not be loaded." : null };
}
export async function getProducts(kind: "trips" | "events") {
  const supabase = await createClient();
  if (kind === "trips") {
    const { data, error } = await supabase
      .from("trips")
      .select("id, slug, title, is_published, is_featured, application_required, seat_selection_enabled, price_egp, departure_at, updated_at")
      .order("updated_at", { ascending: false });
    return {
      items: (data ?? []) as unknown as AdminProduct[],
      error: error ? "trips could not be loaded." : null,
    };
  }

  const { data, error } = await supabase
    .from("events")
    .select("id, slug, title, is_published, is_featured, application_required, price_egp, starts_at, updated_at")
    .order("updated_at", { ascending: false });
  return {
    items: (data ?? []) as unknown as AdminProduct[],
    error: error ? "events could not be loaded." : null,
  };
}
export async function getProduct(kind: "trips" | "events", id: string) {
  const supabase = await createClient();
  if (kind === "trips") {
    const { data } = await supabase
      .from("trips")
      .select("id, slug, title, short_description, description, destination, duration_label, meeting_point, departure_at, return_at, departure_point, return_point, package_label, accommodation, transportation, important_information, price_egp, capacity, booking_mode, application_required, seat_selection_enabled, seat_config, booking_form_fields, payment_proof_required, song_request_enabled, media, inclusions, exclusions, document_url, document_label, is_published, is_featured")
      .eq("id", id)
      .maybeSingle();
    return data as unknown as AdminProductDetail | null;
  }

  const { data } = await supabase
    .from("events")
    .select("id, slug, title, short_description, description, category, venue, starts_at, ends_at, important_information, price_egp, capacity, booking_mode, application_required, media, inclusions, exclusions, document_url, document_label, is_published, is_featured")
    .eq("id", id)
    .maybeSingle();
  return data as unknown as AdminProductDetail | null;
}
export async function getPolicies() {
  const supabase = await createClient(); const { data, error } = await supabase.from("policies").select("id, slug, title, version, body, is_active, updated_at").order("slug");
  return { items: (data ?? []) as AdminPolicy[], error: error ? "Policies could not be loaded." : null };
}
export async function getTeam() {
  const supabase = await createClient(); const { data, error } = await supabase.from("admin_users").select("id, full_name, role, is_active, created_at").order("created_at");
  return { items: (data ?? []) as AdminTeamUser[], error: error ? "Admin team could not be loaded." : null };
}
