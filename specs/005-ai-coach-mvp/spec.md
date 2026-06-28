# Feature Specification: AI Trading Coach MVP (Phase 5)

**Feature Branch**: `005-ai-coach-mvp` | **Created**: 2026-06-28

## User Stories

### P1 — Weekly Coaching Report
As a trader, I receive a structured weekly review with strengths, weaknesses, patterns, and action items grounded in my journal data.

### P1 — Trade Grading
As a trader, each trade is graded on setup, execution, risk, discipline, emotion, and data completeness.

### P1 — Mistake Cost Analysis
As a trader, I see which mistake tags cost me the most money over time.

### P2 — Behavioral Scores
As a trader, I track discipline and emotional stability trends that inform (but never override) risk rules.

## Exit Criteria

- [x] Trade grades persisted with deterministic scoring
- [x] Weekly coaching report generator with evidence
- [x] Coaching action items (stop / improve / repeat)
- [x] Mistake library + cost aggregation from journal
- [x] Coach UI + dashboard widget
- [x] Unit tests for grader and report generator
