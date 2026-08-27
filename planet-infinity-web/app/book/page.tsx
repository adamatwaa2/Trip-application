import { redirect } from "next/navigation";

/**
 * Standalone seat-selection preview.
 *
 * THIS IS NOT THE UNIVERSAL BOOKING PAGE. Seat booking is rare and belongs to
 * the trips that enable it: the real path is /trips/[slug] → its booking flow,
 * which decides whether a seat step exists at all.
 *
 * The page is kept because it is a useful isolated preview of the seat map,
 * and it now renders the SAME shared <SeatSelection> component the trip flow
 * uses, rather than a second copy of the geometry.
 *
 * Preview only: nothing is sent, saved or charged.
 */
export default function BookPage() {
  redirect("/trips");
}
