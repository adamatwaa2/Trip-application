export type RequestAnswer = { label: string; answer: string };

const CAREER_MARKERS = ["career", "careers", "hiring", "job", "recruitment"];
const ANSWER_CONTAINERS = ["answers", "applicationAnswers", "careerAnswers", "responses"];

function humaniseKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function answerText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (Array.isArray(value)) return value.map(answerText).filter(Boolean).join(", ");
  if (!value || typeof value !== "object") return "";
  return Object.entries(value)
    .filter(([, item]) => item !== null && item !== undefined && item !== "" && item !== false && Number(item) !== 0)
    .map(([key, item]) => `${humaniseKey(key)}${typeof item === "number" ? ` × ${item}` : `: ${answerText(item)}`}`)
    .filter((item) => !item.endsWith(": "))
    .join(", ");
}

function answersFromRecord(value: unknown): RequestAnswer[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([label, raw]) => {
    const answer = answerText(raw);
    return label.trim() && answer ? [{ label: humaniseKey(label.trim()), answer }] : [];
  });
}

function answersFromList(value: unknown): RequestAnswer[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const source = entry as { label?: unknown; question?: unknown; answer?: unknown; value?: unknown };
    const label = typeof source.label === "string" ? source.label : typeof source.question === "string" ? source.question : "";
    const answer = answerText(source.answer ?? source.value);
    return label.trim() && answer ? [{ label: label.trim(), answer }] : [];
  });
}

export function isCareerApplication(request: {
  request_type?: unknown;
  external_subject_id?: unknown;
  subject_slug?: unknown;
  subject_title?: unknown;
  notes?: unknown;
  selections?: unknown;
}): boolean {
  const selections = request.selections && typeof request.selections === "object" && !Array.isArray(request.selections)
    ? request.selections as Record<string, unknown>
    : {};
  const markers = [request.external_subject_id, request.subject_slug, request.subject_title, request.notes, selections.kind]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  const labelledCareerAnswer = answersFromRecord(selections.answers)
    .some(({ label }) => /\b(role|job|position)\b/i.test(label));
  return request.request_type === "application"
    && (CAREER_MARKERS.some((marker) => markers.includes(marker)) || labelledCareerAnswer);
}

export function careerApplicationAnswers(selections: Record<string, unknown>): RequestAnswer[] {
  const rows = [
    ...ANSWER_CONTAINERS.flatMap((key) => answersFromRecord(selections[key])),
    ...answersFromList(selections.customResponses),
  ];
  const seen = new Set<string>();
  return rows.filter(({ label, answer }) => {
    const signature = `${label.toLowerCase()}\u0000${answer.toLowerCase()}`;
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

export function careerApplicationRole(selections: Record<string, unknown>): string | null {
  const direct = ["role", "roles", "job", "jobRole", "jobTitle", "position", "positionAppliedFor"]
    .map((key) => answerText(selections[key]))
    .find(Boolean);
  if (direct) return direct;
  const matched = careerApplicationAnswers(selections).find(({ label }) => /\b(role|job|position)\b/i.test(label));
  return matched?.answer || null;
}

export const requestAnswerContainerKeys = new Set([
  ...ANSWER_CONTAINERS,
  "customResponses",
  "careerPhotos",
  "applicationPhotos",
  "uploads",
  "draftId",
  "submittedVersion",
]);
