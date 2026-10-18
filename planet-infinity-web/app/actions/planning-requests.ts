"use server";
import { PLANNING_TYPES, getRequestCategory, validatePlanning, type PlanningInput } from "@/content/planning-requests";
import { submitPublicRequest } from "./requests";
export async function submitPlanningRequest(input: PlanningInput) {
  const error = validatePlanning(input);
  if (error) return { ok: false as const, error };
  return submitPublicRequest({
    requestType: input.kind === "event" ? "event" : "trip",
    subjectTitle: getRequestCategory(input.category)?.label ?? PLANNING_TYPES[input.kind].label,
    subjectSlug: `planning-${input.kind}`, fullName: input.fullName, email: input.email, phone: input.phone,
    guestCount: input.guestCount, termsAccepted: input.consent, whatsappOptIn: false, notes: input.notes,
    selections: { planningKind: input.kind, requestCategory: input.category ?? input.kind, organisationType: input.organisationType, organisationName: input.organisationName, destinationOrEvent: input.destination, preferredDate: input.preferredDate, flexibleDates: input.flexible, budget: input.budget, services: input.services },
  });
}
