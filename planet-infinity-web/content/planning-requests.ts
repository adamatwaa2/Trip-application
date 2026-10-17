export const PLANNING_TYPES = {
  individual: { title: "Your next trip, your way.", label: "Individual trip request", description: "Tell us where you would like to go and what you have in mind. This is an enquiry, not a paid booking." },
  organisation: { title: "A trip for your people.", label: "Company & group trip request", description: "Plan a trip for a company, school, university or another organisation. We will work through the details with you." },
  event: { title: "Let’s create your event.", label: "Event planning request", description: "Share your idea, guest count and the support you need. Our team will follow up with a tailored proposal." },
} as const;
export type PlanningKind = keyof typeof PLANNING_TYPES;
export type PlanningInput = { kind: PlanningKind; fullName: string; email: string; phone: string; organisationType: string; organisationName: string; destination: string; preferredDate: string; flexible: boolean; guestCount: number; budget: string; services: string[]; notes: string; consent: boolean; website: string };
export const PLANNING_SERVICES = ["Venue", "Transport", "Accommodation", "Catering", "Entertainment", "Full planning"];
export function validatePlanning(input: PlanningInput): string | null {
  if (!input || !Object.hasOwn(PLANNING_TYPES, input.kind)) return "Choose a request type.";
  for (const key of ["fullName", "email", "phone", "organisationType", "organisationName", "destination", "preferredDate", "budget", "notes", "website"] as const) if (typeof input[key] !== "string" || input[key].length > (key === "notes" ? 2000 : 254)) return "Check the form details.";
  if (input.website) return "Your request could not be sent.";
  if (input.fullName.trim().length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email) || input.phone.replace(/[^0-9]/g, "").length < 7) return "Enter your name, valid email and phone number.";
  if (!Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 10000) return "Enter a guest count between 1 and 10,000.";
  if (input.kind === "organisation" && (!input.organisationName.trim() || !["Company", "School", "University", "Other"].includes(input.organisationType))) return "Add the organisation name and type.";
  if (!input.destination.trim()) return input.kind === "event" ? "Tell us the event type or location." : "Tell us where you would like to go.";
  if (typeof input.flexible !== "boolean" || typeof input.consent !== "boolean" || !input.consent) return "Accept the policies to continue.";
  if (input.preferredDate) {
    const date = new Date(`${input.preferredDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.preferredDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== input.preferredDate) return "Choose a valid preferred date.";
  }
  if (!Array.isArray(input.services) || input.services.length > 6 || input.services.some(s => !PLANNING_SERVICES.includes(s))) return "Check the selected services.";
  return null;
}
