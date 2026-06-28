# Quickstart: Phase 11 Validation

## Prerequisites

```bash
cp .env.example .env.local
npx supabase start
npx supabase db reset
npm run dev --workspace=apps/web
```

## Screenshot upload slice (implemented)

1. Sign in as a trader with journal access.
2. Open a trade from **Journal → View**.
3. Confirm the **Before you upload** privacy banner lists redaction guidance.
4. Check the privacy acknowledgment box — file input should enable.
5. Upload a PNG/JPEG/WebP chart screenshot (≤ 5MB).
6. Confirm the screenshot appears in the gallery with a signed preview URL.
7. Verify `trades.screenshot_urls` contains a tenant-scoped storage path (`{tenant}/{user}/{trade}/{file}`).

## Planned validation (next slices)

8. Run screenshot analyze → structured JSON with confidence + disclaimer (no buy/sell text).
9. Start replay session from trade → timeline shows entry/exit markers and screenshots.
10. Submit replay answers → scores persisted; summary visible.

## Cross-tenant checks

- User A cannot read User B screenshots (storage policy + pgTAP `rls_trade_screenshots.test.sql`).
- User A cannot upload to another tenant's trade path.

```bash
npm run test --workspace=@tradeos/core
npm run db:test
```
