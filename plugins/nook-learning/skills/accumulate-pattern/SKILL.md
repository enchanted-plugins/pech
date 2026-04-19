---
name: accumulate-pattern
description: >
  Updates per-developer cost-pattern accumulator in state/learnings.json with the current
  session's observations. Rolls μ and σ per (skill, session_type, model) axis using a
  slow exponential update (α = 0.05) so one noisy session doesn't skew learned patterns.
  Exports a cross-plugin-readable snapshot to shared/learnings.json. Use when: PreCompact
  hook fires (end-of-session or compaction trigger). Do not use during an active session —
  runtime invocation mid-session would distort the pattern.
model: sonnet
tools: [Read, Write]
---

# accumulate-pattern

## Preconditions

- The session has at least 5 ledger rows (otherwise there's nothing useful to accumulate)
- `state/learnings.json` exists or can be initialized (first run)

## Inputs

- **Session ledger:** `plugins/cost-tracker/state/ledger-YYYY-MM.jsonl` (current month)
- **Current session_id:** from `ENCHANTED_ATTRIBUTION.session_id`
- **Prior learnings:** `state/learnings.json` (or empty `{patterns: {}}` on first run)

## Steps

1. Group current session's rows by attribution key `<plugin>:<skill>:<agent_tier>` (or fall back to `<plugin>:<agent_tier>` if skill is null, e.g. for hook-driven observations).
2. For each key, compute session-local stats: `session_mean`, `session_stdev`, `session_n`.
3. Load `state/learnings.json`. For each key:
   - **New key:** initialize `{mu = session_mean, sigma = session_stdev, n = session_n, p50 = session_median, p95 = session_p95}`.
   - **Existing key:** update via slow exponential:
     ```
     μ_new = 0.95 × μ_old + 0.05 × session_mean
     σ_new = 0.95 × σ_old + 0.05 × session_stdev
     n_new = n_old + session_n
     ```
     (p50 and p95 use Welford-style online percentile estimators over the full history — they're informational, not used in L3 anomaly math.)
4. Increment `n_sessions_accumulated`. Update `last_updated` timestamp.
5. Write `state/learnings.json` atomically (write-to-tmp + fsync + rename — Allay-A4 pattern).
6. Append a cross-plugin snapshot to `shared/learnings.json` with `origin: "nook"` and the full patterns map.
7. Emit `nook.learning.pattern.updated` event (one per PreCompact, not per key).

**Success criterion:** atomic write succeeded (no partial file on crash); shared/learnings.json appended (not overwritten — peers own their own sections); exactly one event fired regardless of how many keys updated.

## Outputs

- `state/learnings.json` (updated)
- `shared/learnings.json` (appended with Nook's section)
- Event: `nook.learning.pattern.updated`

## Handoff

- `budget-watcher/detect-anomaly` reads `state/learnings.json` for the historical prior when current-session observations are < 30.
- Peer plugins (Flux, Weaver) read `shared/learnings.json#nook` for their own cost-aware decisions.

## Failure modes

| Code | Scenario | Counter |
|------|----------|---------|
| F09 | Concurrent PreCompact from parallel sessions clobbering learnings.json | Atomic rename is mandatory; last-writer-wins is acceptable for slow-update semantics |
| F11 | Tune α up to 0.2 to "learn faster" — session-specific noise leaks into patterns | α = 0.05 is the contract; faster learning defeats the purpose of cross-session stability |
| F13 | Accumulate orphan rows (missing attribution) into a "misc" bucket | Orphans are never accumulated — they're a bug signal, not a data point |
