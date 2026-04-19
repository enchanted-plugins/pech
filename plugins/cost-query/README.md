# cost-query

*Part of [Nook](../../README.md) — Cost Ledger for AI-Assisted Development.*

The developer's query surface into Nook's state. Every state file written by `cost-tracker`, `budget-watcher`, and `nook-learning` is readable through these commands — no raw JSON digging required.

## Slash commands

| Command | Function | Agent tier |
|---------|----------|------------|
| `/nook-cost [--session\|--day\|--month]` | Current spend with attribution breakdown | Haiku (formatter) |
| `/nook-forecast [--session\|--day\|--month]` | L1 forecast with ±2σ band | Sonnet (via cost-tracker/forecaster) |
| `/nook-attribute [--last=N] [--tool=<name>] [--plugin=<slug>]` | Break down last N calls by attribution axis | Haiku (filter + format) |
| `/nook-report` | Dark-themed PDF audit with anomaly narrative | Opus (narrator) + Sonnet (rendering) |

## No hooks

cost-query has zero hook bindings. All invocations are developer-initiated via slash command. This is the *only* Nook sub-plugin that's skill-invoked rather than hook-driven — keeping the observation and query paths cleanly separated.

## Outputs

- `/nook-cost` and `/nook-attribute`: plain-text tables for conversation context
- `/nook-forecast`: plain-text table + optional JSON for scripting (`--json` flag)
- `/nook-report`: dark-themed single-page PDF at `state/reports/report-YYYY-MM-DD-HHMMSS.pdf`, rendered via `docs/architecture/generate.py` + `docs/assets/puppeteer.config.json`

## Events

**Publishes:** none (query surface is passive)

**Subscribes:** none (reads state directly, not via bus)

## Brand invariants

- Plain-text output for terminal consumers; PDF only for `/nook-report`
- Never fabricate data to fill an empty table — if the ledger is empty, say so
- Anomaly narrative only runs Opus when explicitly triggered via `/nook-report` — amortize the orchestrator cost
