"use client";

import { useState } from "react";
import { ScreenshotPrivacyBanner } from "./screenshot-privacy-banner";

export type TradeScreenshot = {
  path: string;
  signed_url: string | null;
};

type TradeScreenshotGalleryProps = {
  tradeId: string;
  initialScreenshots: TradeScreenshot[];
};

export function TradeScreenshotGallery({
  tradeId,
  initialScreenshots,
}: TradeScreenshotGalleryProps) {
  const [screenshots, setScreenshots] = useState(initialScreenshots);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!acknowledged) {
      setError("Confirm the privacy checklist before uploading.");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("trade_id", tradeId);
    formData.set("privacy_acknowledged", "true");

    const fileInput = form.querySelector<HTMLInputElement>('input[name="file"]');
    if (!fileInput?.files?.[0]) {
      setError("Choose a PNG, JPEG, or WebP screenshot.");
      return;
    }

    setUploading(true);
    const res = await fetch("/api/screenshots/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }

    setScreenshots((prev) => [
      ...prev,
      { path: data.storage_path as string, signed_url: (data.signed_url as string | null) ?? null },
    ]);
    form.reset();
    setAcknowledged(false);
  }

  return (
    <section className="card trade-screenshots">
      <h2>Chart screenshots</h2>
      <p className="muted">
        Attach chart captures for later review and replay. Educational use only — no trade signals.
      </p>

      {screenshots.length > 0 ? (
        <div className="screenshot-gallery">
          {screenshots.map((shot) => (
            <figure key={shot.path} className="screenshot-item">
              {shot.signed_url ? (
                <a href={shot.signed_url} target="_blank" rel="noopener noreferrer">
                  <img src={shot.signed_url} alt="Trade chart screenshot" loading="lazy" />
                </a>
              ) : (
                <div className="screenshot-placeholder muted">Preview unavailable</div>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <p className="muted">No screenshots yet.</p>
      )}

      <form onSubmit={(event) => void handleUpload(event)} className="screenshot-upload-form">
        <ScreenshotPrivacyBanner
          acknowledged={acknowledged}
          onAcknowledgeChange={setAcknowledged}
        />
        <label>
          Screenshot file
          <input
            name="file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={!acknowledged || uploading}
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button
          type="submit"
          className="button button-sm"
          disabled={!acknowledged || uploading}
        >
          {uploading ? "Uploading…" : "Upload screenshot"}
        </button>
      </form>
    </section>
  );
}
