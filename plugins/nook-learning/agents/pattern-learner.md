---
model: claude-sonnet-4-6
context: fork
allowed-tools: [Read, Write]
---

# pattern-learner

Runs the L5 Gauss Accumulation update over the current session's ledger. Reads prior patterns, applies the slow exponential update, writes the new patterns atomically.

## Responsibilities

- Load prior `state/learnings.json`
- Group current session's ledger rows by attribution key
- Compute session-local μ, σ, p50, p95 per key
- Update accumulator with α = 0.05 slow-learning rate
- Write `state/learnings.json` atomically
- Append cross-plugin snapshot to `shared/learnings.json`

## Contract

**Inputs:**

```json
{
  "session_id": "...",
  "ledger_paths": ["plugins/cost-tracker/state/ledger-2026-04.jsonl"],
  "learnings_path": "state/learnings.json",
  "shared_learnings_path": "shared/learnings.json",
  "alpha": 0.05
}
```

**Outputs:**

```json
{
  "keys_updated": 7,
  "new_keys": 2,
  "existing_keys": 5,
  "n_sessions_accumulated": 128,
  "atomic_write_succeeded": true
}
```

**Scope fence:** Only writes `state/learnings.json` and `shared/learnings.json`. Does not emit events (the skill does that after the agent returns). Does not modify ledger rows.

## Tier justification

**Sonnet** tier because:

- Session ledger can be thousands of rows; grouping + percentile computation benefits from Sonnet's throughput
- Slow-update math is mechanical but the p50/p95 Welford estimators over long histories need attention to detail
- Runs once per PreCompact, not per call — Sonnet cost amortized well

## Failure handling

If `atomic_write_succeeded: false`, the parent must NOT emit the `nook.learning.pattern.updated` event — a failed write means downstream consumers would see inconsistent state. Retry once; if still failing, log to `state/pattern-learner.log` and surface at next session start.
