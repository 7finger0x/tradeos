import {
  ALLOWED_SCREENSHOT_MIME_TYPES,
  MAX_SCREENSHOT_BYTES,
  type AllowedScreenshotMimeType,
} from "../schemas/screenshot";

const MIME_TO_EXT: Record<AllowedScreenshotMimeType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export type ScreenshotValidationResult =
  | { ok: true; extension: string }
  | { ok: false; error: string };

export function buildTradeScreenshotPath(params: {
  tenantId: string;
  userId: string;
  tradeId: string;
  extension: string;
  uniqueId?: string;
}): string {
  const id = params.uniqueId ?? crypto.randomUUID();
  const ext = params.extension.replace(/^\./, "").toLowerCase();
  return `${params.tenantId}/${params.userId}/${params.tradeId}/${id}.${ext}`;
}

export function extensionFromMime(mimeType: string): string | null {
  if (!(ALLOWED_SCREENSHOT_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return null;
  }
  return MIME_TO_EXT[mimeType as AllowedScreenshotMimeType];
}

export function extensionFromFilename(filename: string): string | null {
  const match = filename.toLowerCase().match(/\.(png|jpe?g|webp)$/);
  if (!match?.[1]) return null;
  if (match[1] === "jpeg") return "jpg";
  return match[1];
}

export function validateScreenshotUpload(input: {
  mimeType: string;
  sizeBytes: number;
  filename?: string;
}): ScreenshotValidationResult {
  if (input.sizeBytes <= 0) {
    return { ok: false, error: "Screenshot file is empty" };
  }
  if (input.sizeBytes > MAX_SCREENSHOT_BYTES) {
    return {
      ok: false,
      error: `Screenshot must be ${MAX_SCREENSHOT_BYTES / (1024 * 1024)}MB or smaller`,
    };
  }

  const extension =
    extensionFromMime(input.mimeType) ??
    (input.filename ? extensionFromFilename(input.filename) : null);

  if (!extension) {
    return {
      ok: false,
      error: "Only PNG, JPEG, and WebP screenshots are supported",
    };
  }

  return { ok: true, extension };
}

export function appendScreenshotPath(existing: string[], storagePath: string): string[] {
  if (existing.includes(storagePath)) {
    return existing;
  }
  return [...existing, storagePath];
}

export function isScreenshotStoragePath(value: string): boolean {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return false;
  }
  const segments = value.split("/");
  return segments.length === 4 && segments.every((segment) => segment.length > 0);
}
