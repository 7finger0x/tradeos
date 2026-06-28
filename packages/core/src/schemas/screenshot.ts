import { z } from "zod";

export const TRADE_SCREENSHOTS_BUCKET = "trade-screenshots" as const;

export const ALLOWED_SCREENSHOT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AllowedScreenshotMimeType = (typeof ALLOWED_SCREENSHOT_MIME_TYPES)[number];

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

export const ScreenshotUploadInputSchema = z.object({
  trade_id: z.string().uuid(),
});

export type ScreenshotUploadInput = z.infer<typeof ScreenshotUploadInputSchema>;

export const ScreenshotPrivacyAckSchema = z.object({
  acknowledged: z.literal(true),
});

export type ScreenshotPrivacyAck = z.infer<typeof ScreenshotPrivacyAckSchema>;

export const SCREENSHOT_PRIVACY_ITEMS = [
  "Account numbers and broker login IDs",
  "Account balances and buying power",
  "Personal names, emails, or phone numbers",
  "Order IDs that could identify your brokerage account",
] as const;
