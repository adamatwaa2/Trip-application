import "server-only";

export const INTERNAL_EVENT_DOCUMENTS_BUCKET = "event-internal-documents";
export const INTERNAL_DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;
export const isEventId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const isDocumentFilename = (value: string) => /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,179}\.pdf$/i.test(value) && !value.includes("..");

export function documentTitle(filename: string) {
  if (filename === "ARENA-Project-AR.pdf") return "ARENA — Project Bible · العربية";
  if (filename === "ARENA-Project-EN.pdf") return "ARENA — Project Bible · English";
  return filename.replace(/^[0-9a-f-]{36}-/i, "");
}
