# Claude Code configs — Nook

Optional per-user Claude Code settings snippets for Nook. The plugin works without any settings changes, but these patterns can sharpen the experience.

## `settings.json` patterns

### Enable hard budget enforcement (opt-in)

By default, Nook is showback (advisory). To route 100%-threshold crossings through `weaver-gate` for developer confirmation before continuing:

```json
{
  "env": {
    "NOOK_HARD_BUDGET": "1"
  }
}
```

Or enable hybrid — advisory for Sonnet/Haiku, hard for Opus above $5/hour:

```json
{
  "env": {
    "NOOK_HYBRID_BUDGET": "1"
  }
}
```

### Allow-list Nook's Bash invocations

Nook's hooks use bash + jq to parse API responses and write ledger rows. To skip permission prompts:

```json
{
  "permissions": {
    "allow": [
      "Bash(jq *)",
      "Bash(python3 plugins/cost-tracker/*)",
      "Bash(python3 plugins/budget-watcher/*)",
      "Bash(python3 plugins/nook-learning/*)"
    ]
  }
}
```

### Status line — always-visible cost

Add the session cost to your status line so it's visible without running `/nook-cost`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "jq -r '\"$\" + (.cost_usd | tostring)' ~/.claude/plugins/nook/plugins/cost-tracker/state/session.json 2>/dev/null || echo '$0.00'"
  }
}
```

### Customize budget ceilings

Budget ceilings live at `plugins/budget-watcher/state/budgets.json`. Example configuration:

```json
{
  "session": { "total_usd": 5.00, "opus_usd": 2.00 },
  "hour":    { "total_usd": 15.00 },
  "day":     { "total_usd": 50.00, "opus_usd": 20.00 },
  "month":   { "total_usd": 500.00 },
  "orphan_rate_threshold": 0.01
}
```

Thresholds fire at 50/80/100% of each ceiling.

### Hook integration

Nook's sub-plugins install their own hooks via `/plugin install`. You do not need to copy hook definitions into your user settings — the plugin manifests handle registration.

## Attribution contract

Every plugin that dispatches work via Claude Code should set the `ENCHANTED_ATTRIBUTION` environment variable before the call:

```bash
export ENCHANTED_ATTRIBUTION='{"plugin":"flux","sub_plugin":"prompt-crafter","skill":"/create","agent_tier":"orchestrator"}'
```

Nook reads this at `PostToolUse` to attribute the call. Missing `ENCHANTED_ATTRIBUTION` means the call is an *orphan* — tracked as a health metric, not hidden in a "misc" bucket.

## Reference

See Claude Code documentation for full `settings.json` schema. Every Nook snippet here is optional; the plugin is fully functional with default settings.
