# Quickstart: Phase 9 Validation

```bash
npm run test --workspace=@tradeos/core
npm run build --workspace=apps/web
npm run dev --workspace=apps/web
```

1. Sign in as operator-capable user (`tenant_admin` or `operator`).
2. Open `/dashboard/hermes`.
3. **Overview** — run ingest, verify stats and observations.
4. **Thresholds** — edit a value, save, confirm success.
5. **Actions** — verify `liquidity_ingest` / `threshold_update` entries.
6. **Compliance** — verify `hermes.*` audit events appear.
7. Sign in as `trader` — thresholds read-only, ingest hidden on Overview.
