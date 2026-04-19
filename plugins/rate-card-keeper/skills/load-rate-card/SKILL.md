---
name: load-rate-card
description: >
  Loads shared/rate-card.json at SessionStart, validates the schema via the
  rate-card-validator agent (Haiku), checks staleness, and emits warning events if the
  rate card is > 60 days old. Use when: a SessionStart hook fires. Do not use for
  computing per-call costs (see observe-call) — this skill only loads and validates the
  card; it does not perform cost math.
model: haiku
tools: [Read]
---

# load-rate-card

## Preconditions

- `shared/rate-card.json` exists
- The file is valid JSON (if not, fire hard failure — cost attribution is impossible without a valid rate card)

## Inputs

- `shared/rate-card.json`
- Current date (for staleness computation)

## Steps

1. Read `shared/rate-card.json` via Python stdlib `json.load`.
2. Validate required top-level keys: `effective_from`, `currency`, `models`, `modifiers`, `fallback_model_rate`.
3. Validate per-model schema: every model entry has `input_rate_per_mtok` and `output_rate_per_mtok`, both positive floats.
4. Validate modifiers: `cache_write_modifier`, `cache_read_modifier`, `batch_discount` — all positive floats; `cache_read_modifier < 1.0 < cache_write_modifier` (cache reads should be cheaper, writes more expensive; if the relation is inverted, the card is corrupted).
5. Compute `days_old = today - effective_from`.
6. Emit staleness signal:
   - `days_old ≤ 60`: silent, no event.
   - `60 < days_old ≤ 90`: emit `nook.rate_card.stale.warning`.
   - `90 < days_old ≤ 180`: emit `nook.rate_card.stale.warning` + set global `NOOK_RATE_CARD_STALE=1` so every ledger row is tagged.
   - `days_old > 180`: emit `nook.rate_card.stale.blocking` + refuse observation (exit non-zero from observe hook — the only place a Nook hook blocks).

**Success criterion:** schema valid, staleness signal correct, rate-card cached in-memory for the session (written to `/tmp/.nook-rate-card-<session_id>.json` for hook-to-hook continuity since hooks are stateless processes).

## Outputs

- `/tmp/.nook-rate-card-<session_id>.json` — cached rate-card for this session
- Event: `nook.rate_card.refreshed` (on newer-than-prior-session load), or `nook.rate_card.stale.{warning,blocking}` per policy

## Handoff

Downstream: `cost-tracker/observe-call` reads the cached rate card per call; `budget-watcher` inherits the staleness tag.

## Failure modes

| Code | Scenario | Counter |
|------|----------|---------|
| F14 | Soft-ignore a > 180 day stale card to keep the session running | Hard-fail; observation against dangerously stale rates is worse than no observation |
| F02 | Fabricate missing modifier values | Reject the card; never compute cost with made-up modifiers |
| F08 | Reach for curl/wget to fetch fresh rates | Brand invariant: zero external runtime deps; refresh happens via CI, not here |
