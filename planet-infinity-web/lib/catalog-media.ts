export type CatalogMediaKind = "image" | "video" | "document";

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
const DOCUMENT_TYPES = ["application/pdf"] as const;

export const CATALOG_MEDIA_LIMITS: Record<CatalogMediaKind, number> = {
  image: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  document: 15 * 1024 * 1024,
};

export const CATALOG_MEDIA_ACCEPT: Record<CatalogMediaKind, string> = {
  image: IMAGE_TYPES.join(","),
  video: VIDEO_TYPES.join(","),
  document: DOCUMENT_TYPES.join(","),
};

const TYPES: Record<CatalogMediaKind, readonly string[]> = {
  image: IMAGE_TYPES,
  video: VIDEO_TYPES,
  document: DOCUMENT_TYPES,
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf",
};

export function validateCatalogMedia(
  kind: CatalogMediaKind,
  mimeType: string,
  size: number,
): string | null {
  if (!TYPES[kind].includes(mimeType)) {
    return kind === "document"
      ? "Only PDF documents are supported."
      : `Choose a supported ${kind} file.`;
  }

  if (!Number.isInteger(size) || size <= 0 || size > CATALOG_MEDIA_LIMITS[kind]) {
    const sizeMb = CATALOG_MEDIA_LIMITS[kind] / 1024 / 1024;
    return `${kind[0].toUpperCase()}${kind.slice(1)} files must be ${sizeMb} MB or smaller.`;
  }

  return null;
}

export function catalogMediaExtension(mimeType: string): string | null {
  return EXTENSIONS[mimeType] ?? null;
}

export function isSafeCatalogUrl(value: string): boolean {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
