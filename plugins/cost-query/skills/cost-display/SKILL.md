---
name: cost-display
description: >
  Formats Pech state into human-readable terminal output (or JSON) for /pech-cost and
  /pech-attribute. Reads ledger + session snapshot + budget-watcher counters; renders
  grouped tables with percentages; flags orphan attribution prominently. Use when:
  /pech-cost or /pech-attribute slash command fires. Do not use for forecasting (see
  forecast-cost) or PDF generation (see generate-report).
model: haiku
tools: [Read]
---

# cost-display

## Preconditions

- `plugins/cost-tracker/state/session.json` exists (current session has observations)
- Mode flag from slash command: `summary` (for `/pech-cost`) or `attribute` (for `/pech-attribute`)

## Inputs

- **Mode:** `summary` or `attribute`
- **Scope:** `session` (default) / `day` / `month` — what totals to show
- **Filters:** `--tool`, `--plugin`, `--tier`, `--by`, `--orphans`, `--last=N` per command docs
- **Ledger:** `plugins/cost-tracker/state/ledger-YYYY-MM.jsonl`
- **Session snapshot:** `plugins/cost-tracker/state/session.json`

## Steps

1. Resolve scope: for `session`, read `session.json`; for `day`, read today's daily rollup; for `month`, aggregate daily rollups.
2. Apply filters (tool, plugin, tier) by tail-reading the ledger as needed.
3. Group by the requested axis (default: `plugin+tier`).
4. Compute subtotals + percentages.
5. Compute orphan rate if any orphan rows present. Surface prominently if > 1% (threshold default).
6. Include cache-waste summary (from L4): hit ratio + dollars wasted on unread writes.
7. Render table (fixed-width, aligned) or JSON per `--json` flag.

**Success criterion:** output is terminal-safe (no ANSI escape sequences when stdout is not a TTY — check `sys.stdout.isatty()`); table columns align; percentages sum to ~100% (rounding slack acceptable).

## Outputs

- Stdout: human-readable table (or JSON if `--json`)
- No state changes

## Handoff

None — this is the terminal output.

## Failure modes

| Code | Scenario | Counter |
|------|----------|---------|
| F02 | Fabricate missing subtotal because ledger filter returned empty | Return "no matching rows" banner; never invent |
| F07 | Add commentary ("looking good!", "concerning trend") to the output | Display raw numbers; narrative is `/pech-report`'s job |
| F13 | ANSI colors break piping to `grep` or file redirect | Check `sys.stdout.isatty()`; skip colors when false |
