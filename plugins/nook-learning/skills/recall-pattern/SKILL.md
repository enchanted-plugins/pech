---
name: recall-pattern
description: >
  Reads state/learnings.json and returns the historical μ/σ/p50/p95 for a requested
  attribution key (plugin:skill:agent_tier). Used by L3 Z-Score Cost Anomaly as a
  historical prior when the current session has fewer than 30 matching observations.
  Use when: detect-anomaly needs a prior and in-session N is insufficient. Do not use to
  compute costs or fire events — this skill is purely a read over the accumulator.
model: haiku
tools: [Read]
---

# recall-pattern

## Preconditions

- `state/learnings.json` exists (returns empty pattern if not)
- The caller provides a well-formed attribution key

## Inputs

- **Attribution key:** `<plugin>:<skill>:<agent_tier>` string
- **Fallback depth:** if exact key not found, try `<plugin>:<agent_tier>` (less specific), then `<plugin>` alone

## Steps

1. Load `state/learnings.json`.
2. Look up the exact key. If found, return `{found: true, specificity: "exact", mu, sigma, p50, p95, n, last_session}`.
3. If not found, try less-specific fallbacks in order. Return with `specificity: "plugin_tier"` or `"plugin_only"`.
4. If nothing matches, return `{found: false}` — never fabricate a pattern.

**Success criterion:** response is complete (all keys present) or `found: false`. No partial returns.

## Outputs

Returned JSON block:

```json
{
  "found": true,
  "specificity": "exact",
  "key": "flux:/converge:sonnet",
  "mu_cost_usd": 0.24,
  "sigma_cost_usd": 0.11,
  "p50": 0.22,
  "p95": 0.48,
  "n": 3421,
  "last_session": "2026-04-19T14:02:00Z"
}
```

## Handoff

L3 anomaly detection uses the returned `(mu, sigma)` when in-session N < 30. If `found: false`, L3 returns `insufficient_data` and does not emit `nook.anomaly.detected`.

## Failure modes

| Code | Scenario | Counter |
|------|----------|---------|
| F02 | Return a fake μ/σ so L3 can fire an anomaly on a brand-new session | `found: false` is the correct return; never invent |
| F13 | Return stale pattern without `last_session` timestamp | Always include `last_session` so caller can decide if pattern is trustworthy |
