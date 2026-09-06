# full — Pech meta-plugin

*Part of [Pech](../../README.md).*

Pulls in all 7 Pech sub-plugins via one dependency resolution pass.

## Install

```
/plugin marketplace add enchanter-ai/pech
/plugin install full@pech
```

## Installs

| Sub-plugin | Engines | Purpose |
|------------|---------|---------|
| [cost-tracker](../cost-tracker/) | L1 Exponential Smoothing Forecast, L4 Cache-Waste Measurement | Writes ledger + session snapshot + daily rollups; produces forecasts |
| [budget-watcher](../budget-watcher/) | L2 Budget Boundary Detection, L3 Z-Score Cost Anomaly | Fires debounced threshold events + 3σ anomaly detection |
| [rate-card-keeper](../rate-card-keeper/) | — | Holds `shared/rate-card.json`; validates schema + staleness at SessionStart |
| [nook-learning](../nook-learning/) | L5 Gauss Learning (Pech) | Per-developer cost-pattern accumulation across sessions |
| [cost-query](../cost-query/) | — | Developer slash commands: `/pech-cost`, `/pech-forecast`, `/pech-attribute`, `/pech-report` |
| [rate-limiter](../rate-limiter/) | — | Token-bucket advisory rate limiter per skill+session; surfaces runaway tool-call loops in real time |
| [rate-shield](../rate-shield/) | — | Opt-in PreToolUse blocking token-bucket rate limiter; sibling of rate-limiter, default disabled |

## Cherry-picking

Need only one engine? Install the individual sub-plugin:

```
/plugin install cost-tracker@pech       # just L1 + L4 ledger and forecasting
/plugin install budget-watcher@pech     # just L2 + L3 threshold + anomaly alerts
/plugin install cost-query@pech         # just the slash commands
/plugin install rate-limiter@pech       # just the advisory rate limiter
/plugin install rate-shield@pech        # just the blocking rate limiter
```

Missing sub-plugins degrade gracefully — e.g. `cost-query` without `cost-tracker` shows "no observations yet"; `budget-watcher` without `rate-card-keeper` refuses to observe (cost attribution requires the rate card).

## Why the meta-plugin exists

Seven sub-plugins working together is the intended configuration. The meta-plugin makes that one command instead of seven. Emu, Wixie, Crow, Hydra, Sylph all ship `full` for the same reason.
