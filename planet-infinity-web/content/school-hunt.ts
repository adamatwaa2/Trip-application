export const SCHOOL_HUNT_SLUG = "school-hunt-dahab";
export const schoolHuntPackages = [
  { id: "essential", title: "Essential", description: "Start with value and the shared experience." },
  { id: "comfort", title: "Comfort", description: "Explore a more comfortable stay for your group." },
  { id: "premium", title: "Premium", description: "Discuss upgraded accommodation preferences." },
  { id: "help", title: "Help us choose", description: "Build a recommendation around our school." },
] as const;
export type HuntPath = "school" | "crew";
export type HuntInput = { path: HuntPath; fullName: string; email: string; phone: string; school: string; city: string; role: string; count: string; package: string; hotel: string; year: string; age: string; strengths: string; motivation: string; availability: string; peerIdea: string; song: string; notes: string; consent: boolean; permission: boolean; website: string };
export function validateHunt(input: HuntInput): string | null {
  if (!input || !["school", "crew"].includes(input.path)) return "Choose a valid application path.";
  if (input.website) return "We could not submit this request.";
  const strings = ["fullName", "email", "phone", "school", "city", "role", "count", "package", "hotel", "year", "age", "strengths", "motivation", "availability", "peerIdea", "song", "notes"] as const;
  if (strings.some(key => typeof input[key] !== "string" || input[key].length > 2000)) return "Check your answers and keep each one under 2,000 characters.";
  if (input.fullName.trim().length < 2 || !input.school.trim() || !input.city.trim()) return "Enter your name, school and city.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email.trim())) return "Enter a valid email address.";
  if (!/^[+\d\s()-]{6,40}$/.test(input.phone.trim())) return "Enter a valid mobile number.";
  if (input.consent !== true) return "Read and accept the required policies before submitting.";
  if (input.path === "school") {
    if (!input.role.trim()) return "Tell us your connection to the school.";
    if (!/^\d+$/.test(input.count) || Number(input.count) < 20 || Number(input.count) > 500) return "Enter an estimated delegation of 20–500 students. Larger groups need a capacity discussion.";
    if (!schoolHuntPackages.some(p => p.id === input.package)) return "Choose a package preference.";
  } else {
    if (!input.year.trim() || !/^\d+$/.test(input.age) || Number(input.age) < 15 || Number(input.age) > 21) return "Enter your senior school year and an age from 15 to 21 for this proposed intake.";
    if (![input.strengths, input.motivation, input.availability, input.peerIdea].every(v => v.trim().length >= 3)) return "Tell us about your strengths, availability, motivation and an idea to create with classmates.";
    if (input.permission !== true) return "Acknowledge the permission requirements before applying.";
  }
  return null;
}
