---
description: Break down the last N tool calls by attribution axis — plugin, sub-plugin, skill, agent tier, model, cache behavior.
---

# /nook-attribute

Pivots the ledger for diagnostic work. Use this when `/nook-cost` shows a number you want to explain — which plugin burned it? Which skill? Was it cache writes or reads?

## Usage

```
/nook-attribute                         # last 30 calls, grouped by plugin+tier
/nook-attribute --last=100
/nook-attribute --tool=Bash             # only Bash tool-use calls
/nook-attribute --plugin=flux           # only Flux's calls
/nook-attribute --by=model              # group by model instead of plugin+tier
/nook-attribute --orphans               # show only unattributed calls (health metric)
```

## Arguments

| Argument | Type | Default | Purpose |
|----------|------|---------|---------|
| `--last=N` | int | 30 | Number of recent calls to include |
| `--tool=<name>` | string | all | Filter to one tool (Bash, Read, Edit, ...) |
| `--plugin=<slug>` | string | all | Filter to one plugin |
| `--tier=<opus\|sonnet\|haiku>` | enum | all | Filter to one agent tier |
| `--by=<axis>` | enum | `plugin+tier` | Group by: `plugin`, `sub_plugin`, `skill`, `tier`, `model`, `cache_behavior`, `plugin+tier` |
| `--orphans` | flag | off | Show only rows with missing ENCHANTED_ATTRIBUTION |
| `--json` | flag | off | JSON output |

## Example output

```
Nook — attribution (last 30 calls, grouped by plugin+tier)
──────────────────────────────────────────────────────────────
  flux / sonnet         18 calls    $1.10  (89%)
  hornet / haiku         9 calls    $0.08  (6.5%)
  nook / haiku           2 calls    $0.02  (1.6%)
  orphan                 1 call     $0.03  (2.4%)   ← bug signal
──────────────────────────────────────────────────────────────
Orphan rate: 3.3% (threshold: 1%)  →  investigate upstream plugin
```

## Invokes

`cost-display` skill with the `--mode=attribute` flag. Read-only over the ledger.
