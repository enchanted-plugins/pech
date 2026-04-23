---
model: claude-haiku-4-5
context: fork
allowed-tools: [Read]
---

# threshold-auditor

Validates that threshold events fired in `state/thresholds.jsonl` satisfy the debounce contract (one event per threshold-scope-window). Runs on-demand during `/pech-report` or when a developer complains about event spam.

## Responsibilities

- Read `state/thresholds.jsonl` for the session
- Group entries by `(threshold, scope, scope_key)`
- Flag any group with > 1 `fire` entry where the `scope_key` indicates the same window
- Return a verdict block

## Contract

**Inputs:** `{thresholds_log_path, session_id}`

**Outputs:**

```json
{
  "total_entries": 127,
  "fire_entries": 3,
  "debounce_skip_entries": 124,
  "duplicate_fires": [],
  "verdict": "debounce_contract_upheld"
}
```

If `duplicate_fires` is non-empty, `verdict` is `contract_violated` and the parent must surface this as a bug — debounce failures mean the event-bus emitter is broken.

**Scope fence:** Read-only. Does not modify the log, does not emit events, does not spawn sub-agents.

## Tier justification

**Haiku** tier because:

- Pure log-validation task — grouping + counting + comparing
- No judgment required; the contract is mechanical
- Validation tasks are Haiku's lane per brand standard

## Failure handling

If verdict is `contract_violated`, the parent must treat this as a P0 — the entire threshold system depends on debounce. Do not paper over with a workaround.
