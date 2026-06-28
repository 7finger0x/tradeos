"use client";

import { SCREENSHOT_PRIVACY_ITEMS } from "@tradeos/core";

type ScreenshotPrivacyBannerProps = {
  acknowledged: boolean;
  onAcknowledgeChange: (value: boolean) => void;
};

export function ScreenshotPrivacyBanner({
  acknowledged,
  onAcknowledgeChange,
}: ScreenshotPrivacyBannerProps) {
  return (
    <div className="privacy-banner" role="note" aria-label="Screenshot privacy guidance">
      <h3>Before you upload</h3>
      <p className="muted">
        Chart screenshots are stored securely for your journal review. Redact or crop sensitive
        information — this is educational review only, not investment advice.
      </p>
      <ul className="privacy-list">
        {SCREENSHOT_PRIVACY_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <label className="privacy-ack">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => onAcknowledgeChange(e.target.checked)}
        />
        I confirm this screenshot has no account numbers, balances, or personal identifiers
      </label>
    </div>
  );
}
