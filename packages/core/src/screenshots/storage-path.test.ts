import { describe, expect, it } from "vitest";
import {
  appendScreenshotPath,
  buildTradeScreenshotPath,
  extensionFromMime,
  isScreenshotStoragePath,
  validateScreenshotUpload,
} from "./storage-path";

describe("buildTradeScreenshotPath", () => {
  it("builds tenant-scoped object path", () => {
    const path = buildTradeScreenshotPath({
      tenantId: "11111111-1111-1111-1111-111111111111",
      userId: "22222222-2222-2222-2222-222222222222",
      tradeId: "33333333-3333-3333-3333-333333333333",
      extension: "png",
      uniqueId: "abc-123",
    });

    expect(path).toBe(
      "11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/33333333-3333-3333-3333-333333333333/abc-123.png",
    );
  });
});

describe("validateScreenshotUpload", () => {
  it("accepts allowed mime types under size limit", () => {
    const result = validateScreenshotUpload({
      mimeType: "image/png",
      sizeBytes: 1024,
      filename: "chart.png",
    });

    expect(result).toEqual({ ok: true, extension: "png" });
  });

  it("rejects unsupported mime types", () => {
    const result = validateScreenshotUpload({
      mimeType: "application/pdf",
      sizeBytes: 1024,
      filename: "chart.pdf",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("PNG, JPEG, and WebP");
    }
  });

  it("rejects files over max size", () => {
    const result = validateScreenshotUpload({
      mimeType: "image/jpeg",
      sizeBytes: 6 * 1024 * 1024,
    });

    expect(result.ok).toBe(false);
  });
});

describe("appendScreenshotPath", () => {
  it("appends unique paths without duplicates", () => {
    const first = appendScreenshotPath([], "tenant/user/trade/a.png");
    const second = appendScreenshotPath(first, "tenant/user/trade/b.png");
    const third = appendScreenshotPath(second, "tenant/user/trade/a.png");

    expect(second).toHaveLength(2);
    expect(third).toHaveLength(2);
  });
});

describe("extensionFromMime", () => {
  it("maps jpeg to jpg", () => {
    expect(extensionFromMime("image/jpeg")).toBe("jpg");
  });
});

describe("isScreenshotStoragePath", () => {
  it("detects storage paths vs external URLs", () => {
    expect(
      isScreenshotStoragePath(
        "11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/33333333-3333-3333-3333-333333333333/file.png",
      ),
    ).toBe(true);
    expect(isScreenshotStoragePath("https://example.com/chart.png")).toBe(false);
  });
});
