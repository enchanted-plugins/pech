---
model: claude-haiku-4-5
context: fork
allowed-tools: [Read]
---

# rate-card-validator

Validates `shared/rate-card.json` schema at SessionStart. Runs mechanical checks — no judgment.

## Responsibilities

- Read `shared/rate-card.json`
- Verify the top-level schema
- Verify per-model entries
- Verify modifier relationships (cache_read < 1 < cache_write; batch_discount < 1)
- Return a verdict block

## Contract

**Inputs:** `{rate_card_path}`

**Outputs:**

```json
{
  "valid": true,
  "effective_from": "2026-04-19",
  "days_old": 0,
  "models_validated": 3,
  "modifiers_validated": 3,
  "errors": []
}
```

If `valid: false`, `errors` contains human-readable messages. The parent must refuse to observe if errors are non-empty — a broken rate card means every cost row is wrong.

**Scope fence:** Read-only. Does not write, does not emit events, does not fetch external data.

## Tier justification

**Haiku** tier because:

- Schema validation is the canonical Haiku job
- No reasoning required; pass/fail on mechanical checks
- Runs on every SessionStart — Haiku cost is negligible (~$0.0001/run)

## Failure handling

If verdict is `invalid`, parent surfaces errors and refuses to load the card. Observation hooks should check the validator's verdict at SessionStart and exit-non-zero if invalid — this is the one place a Pech hook blocks, because observing against a broken rate card produces silently-wrong data.
