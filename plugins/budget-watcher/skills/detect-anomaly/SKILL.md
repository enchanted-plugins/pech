---
name: detect-anomaly
description: >
  Runs L3 Z-Score Cost Anomaly detection against the last 30 ledger rows matching the
  same attribution tuple (plugin, sub_plugin, skill, agent_tier, model). Fires
  nook.anomaly.detected when |z| > 3, for both spikes and drops. Use when: a PostToolUse
  hook fires and the ledger row is in place. Do not use when the attribution tuple has
  fewer than 30 historical matches — emit insufficient_data instead of false-positive
  anomaly.
model: haiku
tools: [Read, Write]
---

# detect-anomaly

## Preconditions

- Latest ledger row is available in `plugins/cost-tracker/state/ledger-YYYY-MM.jsonl`
- Attribution tuple on the row is complete (not an orphan — orphans skip anomaly detection)

## Inputs

- **Latest ledger row** (the one we're evaluating)
- **History:** previous rolling rows of the same attribution tuple, read from current and prior months' ledger if needed

## Steps

1. Extract the attribution tuple from the latest row: `(plugin, sub_plugin, skill, agent_tier, model)`.
2. Query the ledger (current + prior month if needed) for the most recent 30 rows matching that tuple. If < 30 matches exist, emit `insufficient_data` state and skip — never run anomaly detection on small N.
3. Compute rolling μ and σ over the 30 matched rows' `cost_usd` values:
   ```
   μ = mean(costs)
   σ = stdev(costs, population=True)
   ```
4. Compute z-score for the current row: `z = (current_cost - μ) / σ`.
5. If `|z| > 3.0`:
   - Direction = `spike` if `z > 0`, `drop` if `z < 0`.
   - Fire `nook.anomaly.detected` with full context (current cost, μ, σ, z, direction).
   - Append to `state/anomalies.jsonl` for audit.

**Why alert on drops, not just spikes:** a cost drop of 3σ usually means the prompt-cache hit rate spiked — *which is good news and should be surfaced* so the developer knows what pattern is working. Drops are also the earliest signal of a rate-card mismatch (Nook thinks the call costs 10× less than it actually does).

**Success criterion:** μ and σ computed honestly (population stdev, not sample — we have the full observed window); z-score reported even when `|z| < 3` so the narrator agent has the signal for context.

## Outputs

- `state/anomalies.jsonl` entry
- Event: `nook.anomaly.detected` (only when `|z| > 3`)

## Handoff

`cost-query/anomaly-narrator` (Opus) may be invoked at `/nook-report` time to generate human-readable narrative for surfaced anomalies. This skill does not call Opus — narration happens lazily on developer query.

## Failure modes

| Code | Scenario | Counter |
|------|----------|---------|
| F11 | Tune σ threshold to 2.5 to "catch more anomalies" | 3σ is the honest contract; lowering it inflates false-positive rate and trains the developer to mute L3 |
| F13 | Run detection with N < 10 and report confident anomalies | Mandatory `insufficient_data` return below N = 30 |
| F02 | Fabricate missing attribution fields to get the tuple | If attribution is incomplete, skip — don't invent |
