"use server";
import { submitPublicRequest } from "./requests";
import { schoolHuntPackages, validateHunt, type HuntInput } from "@/content/school-hunt";
export async function submitSchoolHunt(input: HuntInput) {
  const error = validateHunt(input);
  if (error) return { ok: false as const, error };
  const clean = (value: string, n = 2000) => value.trim().slice(0, n);
  const school = input.path === "school";
  const answers = school ? {
    "School": clean(input.school, 200), "City": clean(input.city, 120), "Contact role": clean(input.role, 120),
    "Estimated students": Number(input.count), "Package preference": schoolHuntPackages.find(p => p.id === input.package)!.title,
    "Hotel preference": clean(input.hotel) || "Please recommend", "Stage": "Expression of interest; follow-up required",
  } : {
    "School": clean(input.school, 200), "City": clean(input.city, 120), "School year": clean(input.year, 120), "Age": Number(input.age),
    "Strengths": clean(input.strengths), "Why join": clean(input.motivation), "Availability": clean(input.availability),
    "Experience to create with classmates": clean(input.peerIdea), "Song (optional)": clean(input.song, 300), "Permission acknowledgement": true,
  };
  return submitPublicRequest({
    requestType: school ? "trip" : "application", subjectSlug: school ? "school-hunt-school-interest" : "school-hunt-crew",
    subjectTitle: school ? "School Hunt · School interest" : "School Hunt · Youth crew", externalSubjectId: "school-hunt-dahab",
    fullName: clean(input.fullName, 120), email: clean(input.email, 254), phone: clean(input.phone, 40),
    guestCount: school ? Number(input.count) : undefined, termsAccepted: true, whatsappOptIn: false,
    selections: { kind: school ? "school-hunt-school" : "school-hunt-crew", answers }, notes: clean(input.notes),
  });
}
