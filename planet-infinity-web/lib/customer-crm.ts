import type { AdminCustomer } from "@/lib/admin-operations";

export type CustomerStage = "lead" | "qualified" | "booked" | "returning" | "closed";

export function customerStage(customer: AdminCustomer): CustomerStage {
  const activeBookings = customer.bookings.filter((booking) => booking.status !== "cancelled");
  if (activeBookings.length > 1) return "returning";
  if (activeBookings.length === 1) return "booked";
  if (customer.requests.some((request) => request.status === "accepted" || request.status === "confirmed")) return "qualified";
  if (customer.requests.length && customer.requests.every((request) => request.status === "rejected")) return "closed";
  return "lead";
}

export function customerTotals(customer: AdminCustomer) {
  return customer.bookings.reduce(
    (totals, booking) => ({
      value: totals.value + Number(booking.total_amount || 0),
      paid: totals.paid + Number(booking.amount_paid || 0),
    }),
    { value: 0, paid: 0 },
  );
}

export function customerLastActivity(customer: AdminCustomer): string {
  return [...customer.requests, ...customer.bookings]
    .map((item) => item.created_at)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))[0] ?? customer.created_at;
}

export function customerSubject(customer: AdminCustomer): string {
  const latestBooking = [...customer.bookings].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (latestBooking) return latestBooking.trip?.title ?? latestBooking.event?.title ?? "Booking";
  const latestRequest = [...customer.requests].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return latestRequest?.subject_title ?? (latestRequest ? "Application" : "New customer");
}
