# Nook — Cost Ledger for AI-Assisted Development

*An @enchanted-plugins product — algorithm-driven, agent-managed, self-learning.*

Nook attributes every token, every tool-use turn, every prompt-cache hit, and every batch job to the plugin / sub-plugin / skill / agent tier / model that fired it — then forecasts your spend and fires threshold alerts so peer plugins can degrade gracefully.

## Origin

Tom Nook from *Animal Crossing* — the merchant-banker who tracks every bell you owe and remembers it forever. Every transaction visible. The debt never hides. In *Animal Crossing*, you always know what your house renovation costs because Nook won't let you forget; in Claude Code, you always know what your `/converge` run cost because Nook won't let you forget.

The question this plugin answers: *"What did it cost?"*

## Problem

AI-assisted development is invisible money. A `/converge` run silently calls Opus once, Sonnet 40 times, Haiku 80 times. Prompt caching adds a 1.25× surcharge to writes and a 10× discount on reads — misattribute the bucket and you shift ~15% of your spend to the wrong line. A Flux orchestrator fires a Sonnet sub-agent whose cost is invisibly charged to the parent thread, making Opus look 30× costlier than it is. Dashboards from Anthropic's console roll everything up to "your org spent $X today" — useless for knowing which plugin, which skill, which developer, which tool chain is burning the budget.

Nook makes AI spend observable the way Stripe made payments observable: tag every event at write-time with a stable schema, aggregate into windowed rollups, forecast with honest confidence bands, alert on threshold crossings, and attribute to the correct layer.

## Architecture

```
                                     ┌────────────────────────────┐
                                     │   Claude Code session      │
                                     │   (hooks + tool calls)     │
                                     └──────────────┬─────────────┘
                                                    │ PostToolUse (every call)
                                                    │ + ENCHANTED_ATTRIBUTION env
                                                    ▼
                          ┌──────────────────────────────────────────────────┐
                          │                        Nook                      │
                          │                                                  │
   ┌─────────────────┐    │   ┌──────────────┐    ┌────────────────────┐    │
   │ rate-card-      │◀───┼───│ cost-tracker │───▶│  budget-watcher    │    │
   │ keeper          │    │   │ (L1, L4)     │    │  (L2, L3)          │    │
   │ rate-card.json  │    │   │ ledger.jsonl │    │  budgets.json      │    │
   └─────────────────┘    │   └──────┬───────┘    └─────────┬──────────┘    │
                          │          │                      │               │
                          │          ▼                      ▼               │
                          │   ┌──────────────┐    ┌────────────────────┐    │
                          │   │ nook-learning│    │    cost-query      │    │
                          │   │ (L5)         │    │ /nook-{cost,       │    │
                          │   │ learnings    │    │  forecast,         │    │
                          │   │              │    │  attribute,        │    │
                          │   │              │    │  report}           │    │
                          │   └──────────────┘    └────────────────────┘    │
                          │                                                  │
                          └──────────────────┬───────────────────────────────┘
                                             │ threshold + rollup events
                                             ▼
                                  ┌──────────────────────┐
                                  │  enchanted-mcp bus   │
                                  │  nook.budget.*       │
                                  │  nook.anomaly.*      │
                                  └──────────┬───────────┘
                                             │ peers degrade gracefully
                           ┌─────────────────┼─────────────────┐
                           ▼                 ▼                 ▼
                      ┌─────────┐      ┌─────────┐       ┌─────────┐
                      │  Flux   │      │ Weaver  │       │  Allay  │
                      │ → Haiku │      │ → defer │       │ → trim  │
                      └─────────┘      │   polish│       │   ctx   │
                                       └─────────┘       └─────────┘
```

Diagrams in [docs/architecture/](docs/architecture/) are auto-generated from `plugin.json`, `hooks.json`, and `SKILL.md` frontmatter by `docs/architecture/generate.py`. Never hand-edited.

## Named algorithms

Every engine is backed by a formal algorithm. Full derivations in [docs/science/README.md](docs/science/README.md).

$$\hat{y}_{t+1} = \alpha \cdot y_t + (1 - \alpha) \cdot \hat{y}_t, \quad \alpha = 0.3 \qquad \text{L1: Exponential Smoothing Forecast}$$

$$z = \frac{y - \mu}{\sigma}, \qquad \text{L3 Anomaly iff } |z| > 3 \qquad \text{over 30-call window of same attribution tuple}$$

| ID | Name | Plugin | Algorithm |
|----|------|--------|-----------|
| L1 | Exponential Smoothing Forecast | cost-tracker | Weighted moving average forecasting with ±2σ confidence bands over session / day / month horizons |
| L2 | Budget Boundary Detection | budget-watcher | Per-scope debounced threshold detection at 50 / 80 / 100% (session, hour, day, month × tier × model) |
| L3 | Z-Score Cost Anomaly | budget-watcher | 3σ outlier detection over 30-call rolling window matched on attribution tuple; alerts on spikes and drops |
| L4 | Cache-Waste Measurement | cost-tracker | Hit ratio + unread-write detection; surfaces dollars wasted on unused prompt-cache writes |
| L5 | Gauss Learning (Nook) | nook-learning | Per-developer spend-pattern accumulation with Allay-A4 atomic serialization |

**Defining engine:** L1 — forecasting is what makes cost data actionable. Raw ledgers are bookkeeping; forecasts with honest confidence bands are the product.

## Install

```bash
/plugin marketplace add enchanted-plugins/nook
/plugin install full@nook
```

To cherry-pick:

```bash
/plugin install cost-tracker@nook
/plugin install budget-watcher@nook
```

Verify with `/plugin list`.

## Plugins

| Command | Function | Agent tier |
|---------|----------|------------|
| `/nook-cost [--session|--day|--month]` | Current spend breakdown by attribution tuple | Haiku |
| `/nook-forecast [--session|--day|--month]` | L1 forecast with ±2σ band | Sonnet |
| `/nook-attribute [--last=N] [--tool=Bash\|Read\|...]` | Break down last N calls by plugin / tier / model | Haiku |
| `/nook-report` | Dark-themed PDF audit with anomaly narrative | Opus (anomaly triage) + Sonnet (rendering) |

## Comparison

| Feature | Nook | Anthropic Console | OpenAI Dashboard | LangSmith |
|---------|------|-------------------|------------------|-----------|
| Per-plugin attribution | ✓ | — | — | partial |
| Per-agent-tier attribution (Opus/Sonnet/Haiku) | ✓ | — | — | — |
| Prompt-cache write/read separation | ✓ | summary only | n/a | — |
| Honest confidence bands on forecasts | ✓ | — | — | — |
| Threshold events to peer plugins | ✓ | — | — | — |
| Runs locally, zero external deps | ✓ | cloud | cloud | cloud |

## Lifecycle in the ecosystem

```
   Developer request
         │
         ▼
   ┌──────────┐    Claude Code dispatches tool_use
   │  Reaper  │    ┌─────────────────────────────┐
   │ scans    │───▶│  Flux (prompt) → Allay      │
   │ configs  │    │  (tokens) → Nook (attrib.   │
   └──────────┘    │  cost) → Hornet (change) → │
                   │  Weaver (commit/PR)         │
                   └──────┬──────────────────────┘
                          │ nook.budget.threshold.crossed
                          ▼
                   Peer plugins degrade gracefully
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

---

Repo: https://github.com/enchanted-plugins/nook
