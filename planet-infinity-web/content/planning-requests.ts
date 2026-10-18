export const PLANNING_TYPES = {
  individual: { title: "Your next trip, your way.", label: "Individual trip request", description: "Tell us where you would like to go and what you have in mind. This is an enquiry, not a paid booking." },
  organisation: { title: "A trip for your people.", label: "Company & group trip request", description: "Plan a trip for a company, school, university or another organisation. We will work through the details with you." },
  event: { title: "Let’s create your event.", label: "Event planning request", description: "Share your idea, guest count and the support you need. Our team will follow up with a tailored proposal." },
} as const;
export type PlanningKind = keyof typeof PLANNING_TYPES;
export const REQUEST_CATEGORIES = [
  { id: "senior", world: "trips", label: "Senior Trip", kind: "organisation", organisationType: "" },
  { id: "school", world: "trips", label: "School Trip", kind: "organisation", organisationType: "School" },
  { id: "university", world: "trips", label: "University Trip", kind: "organisation", organisationType: "University" },
  { id: "individual", world: "trips", label: "Individual Trip", kind: "individual", organisationType: "" },
  { id: "group", world: "trips", label: "Group Trip", kind: "individual", organisationType: "" },
  { id: "company", world: "trips", label: "Company Trip", kind: "organisation", organisationType: "Company" },
  { id: "custom", world: "trips", label: "Custom Trip", kind: "individual", organisationType: "" },
  { id: "prom", world: "events", label: "Prom Planning", kind: "event", organisationType: "" },
  { id: "event", world: "events", label: "Plan an Event", kind: "event", organisationType: "" },
  { id: "company-event", world: "events", label: "Company Event", kind: "event", organisationType: "Company" },
  { id: "team-building", world: "events", label: "Team Building", kind: "event", organisationType: "Company" },
] as const;
export type RequestCategory = (typeof REQUEST_CATEGORIES)[number]["id"];
export function getRequestCategory(id: unknown) { return REQUEST_CATEGORIES.find(category => category.id === id); }
export const PROM_VENUE_OPTIONS = ["Hotel", "Outdoor venue", "We already have a venue", "Custom setting", "Suggest venues & ideas"];
export type PlanningInput = { category?: RequestCategory; venuePreference?: string; meetingRequested?: boolean; kind: PlanningKind; fullName: string; email: string; phone: string; organisationType: string; organisationName: string; destination: string; preferredDate: string; flexible: boolean; guestCount: number; budget: string; services: string[]; notes: string; consent: boolean; website: string };
export const PLANNING_SERVICES = ["Venue", "Transport", "Accommodation", "Catering", "Entertainment", "Full planning"];
export const PROM_SERVICES = ["Venue", "Decoration & theme", "DJs", "Sound & lighting", "Photography & video", "Stage & production", "Food & drinks", "Transport", "Full planning"];
export const TEAM_BUILDING_SERVICES = ["Venue", "Team activities & facilitation", "Transport", "Catering", "Accommodation", "Full planning"];
export function planningServices(category: unknown) { return category === "prom" ? PROM_SERVICES : category === "team-building" ? TEAM_BUILDING_SERVICES : PLANNING_SERVICES; }
export function validatePlanning(input: PlanningInput): string | null {
  if (!input || !Object.hasOwn(PLANNING_TYPES, input.kind)) return "Choose a request type.";
  const category = getRequestCategory(input.category);
  if (input.category !== undefined && (!category || category.kind !== input.kind || (category.organisationType && category.organisationType !== input.organisationType))) return "Choose a valid request category.";
  if (input.venuePreference !== undefined && (typeof input.venuePreference !== "string" || (input.venuePreference !== "" && (!PROM_VENUE_OPTIONS.includes(input.venuePreference) || category?.id !== "prom")))) return "Choose a valid venue preference.";
  if (input.meetingRequested !== undefined && typeof input.meetingRequested !== "boolean") return "Check the meeting request.";
  for (const key of ["fullName", "email", "phone", "organisationType", "organisationName", "destination", "preferredDate", "budget", "notes", "website"] as const) if (typeof input[key] !== "string" || input[key].length > (key === "notes" ? 2000 : 254)) return "Check the form details.";
  if ((category?.id === "company-event" || category?.id === "team-building") && !input.organisationName.trim()) return "Add the company name.";
  if ((category?.id === "prom" || category?.id === "senior") && (!input.organisationName.trim() || !["School", "University", "Other"].includes(input.organisationType))) return "Add the organising school, university or group.";
  if (input.website) return "Your request could not be sent.";
  if (input.fullName.trim().length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email) || input.phone.replace(/[^0-9]/g, "").length < 7) return "Enter your name, valid email and phone number.";
  if (!Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 10000) return "Enter a guest count between 1 and 10,000.";
  if (input.kind === "organisation" && (!input.organisationName.trim() || !["Company", "School", "University", "Other"].includes(input.organisationType))) return "Add the organisation name and type.";
  if (!input.destination.trim() && category?.id !== "prom") return input.kind === "event" ? "Tell us the event type or location." : "Tell us where you would like to go.";
  if (typeof input.flexible !== "boolean" || typeof input.consent !== "boolean" || !input.consent) return "Accept the policies to continue.";
  if (input.preferredDate) {
    const date = new Date(`${input.preferredDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.preferredDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== input.preferredDate) return "Choose a valid preferred date.";
  }
  const services = planningServices(input.category);
  if (!Array.isArray(input.services) || input.services.length > services.length || input.services.some(s => !services.includes(s))) return "Check the selected services.";
  return null;
}
