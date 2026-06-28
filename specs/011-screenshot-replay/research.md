# Research: Phase 11 Screenshot + Replay

## Decisions (Draft)

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Storage | Supabase `trade-screenshots` bucket | Already defined in foundation migration |
| Screenshot field | Reuse `trades.screenshot_urls` | Phase 2 deferred upload; field ready |
| AI role | Educational chart review only | Constitution III/V; skill `tradeos-screenshot-replay-builder` |
| Replay scope | Training review, not execution | Charter Trade Replay workflow |
| Hermes replay | Separate domain | `hermes_replay_evidence` is liquidity validation, not trader replay |
| Backtesting | Out of scope | Charter Phase 11 is screenshot + replay; OHLCV engine later |

## Open Questions (for `/speckit-clarify`)

1. First MVP slice: upload + analyze only, or replay without vision first?
2. Vision provider: OpenAI vs Anthropic (env keys in `.env.example`)?
3. Replay entry point: dedicated `/dashboard/replay` vs trade detail drawer?
