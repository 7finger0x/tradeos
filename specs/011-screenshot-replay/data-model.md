# Data Model: Phase 11 (Draft)

## Existing

- `trades.screenshot_urls text[]` — append-only URLs after upload
- Storage bucket `trade-screenshots` (private)

## Proposed (TBD via `/speckit-plan`)

### replay_sessions

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK | RLS |
| user_id | uuid FK | Owner |
| trade_id | uuid FK | Source trade |
| status | text | `draft` \| `in_progress` \| `completed` |
| summary | jsonb | Scores + narrative (structured) |
| created_at | timestamptz | |

### replay_events

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| session_id | uuid FK | |
| event_type | text | `entry`, `exit`, `screenshot`, `note`, `question` |
| payload | jsonb | Marker data, screenshot URL, question text |
| sequence | int | Timeline order |

### replay_answers

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| session_id | uuid FK | |
| event_id | uuid FK | Question event |
| answer | text | User response |
| score | numeric | Deterministic rubric score |

## API Contracts (Draft)

- `POST /api/screenshots/upload` — multipart → storage URL → patch trade
- `POST /api/screenshots/analyze` — `{ trade_id, screenshot_url }` → structured analysis
- `GET/POST /api/replay/sessions` — session CRUD + event timeline
