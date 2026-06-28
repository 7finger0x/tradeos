# Tasks: Screenshot + Replay Intelligence (Phase 11)

**Feature**: 011-screenshot-replay | **Status**: In progress — upload slice complete

## Phase 0: Speckit (Required Before Code)

- [x] S001 Run `/speckit-clarify` — MVP slice: upload + analyze vs replay-first *(upload-first chosen)*
- [x] S002 Run `/speckit-plan` — finalize `data-model.md`, API contracts, migration design *(draft sufficient for slice)*
- [x] S003 Run `/speckit-tasks` — story-ordered implementation tasks *(this file)*

## Phase 1: Screenshot Upload (P1 — first vertical slice)

- [x] T001 Storage RLS policies for `trade-screenshots` bucket
- [x] T002 `POST /api/screenshots/upload` — tenant-scoped path, append URL to trade
- [x] T003 Privacy warning component before upload (redact account/balance guidance)
- [x] T004 Journal trade detail — screenshot gallery + upload control

## Phase 2: Screenshot AI Review (P1)

- [ ] T005 Zod schema for screenshot analysis output in `packages/ai`
- [ ] T006 `POST /api/screenshots/analyze` — vision call + structured response + disclaimer
- [ ] T007 UI panel for analysis results on trade detail

## Phase 3: Trade Replay (P1)

- [ ] T008 Migration: `replay_sessions`, `replay_events`, `replay_answers` + RLS + pgTAP
- [ ] T009 Core replay builder from trade + screenshots + journal notes
- [ ] T010 `GET/POST /api/replay/sessions` + answer submission
- [ ] T011 Replay timeline UI with decision-point questions

## Phase 4: Polish

- [x] T012 Unit tests (core screenshot path + validation)
- [ ] T013 `quickstart.md` validation steps
- [ ] T014 README + exit criteria sign-off
