# Getting started with Nook

**Status: planned.** Nook has not shipped a public release yet. This page describes what the first release will look like. Until then, treat it as design intent, not documentation.

Nook is the ecosystem's cost tracker: every AI-assisted transaction tallied, every budget remembered, every forecast honest.

## Planned install

Once v0.1.0 ships:

```
/plugin marketplace add enchanted-plugins/nook
/plugin install full@nook
```

## Planned commands

Commands already present in the repo tree:

| Command | What it will do |
|---------|-----------------|
| `/nook-cost` | Show current spend for this session, project, or time window. |
| `/nook-attribute` | Break spend down by provider, model, command, or sub-plugin. |
| `/nook-forecast` | Exponential-smoothing forecast (L1) of this week's / month's spend. |
| `/nook-report` | Full spend report — numbers, trends, top-3 cost sinks. |

## Planned engines

| ID | Name | Purpose |
|----|------|---------|
| L1 | Exponential Smoothing | Week-over-week spend forecast. |
| L2 | Budget Boundary | Per-project hard / soft spend caps with escalation. |
| L3–L5 | TBD | See [ROADMAP.md](ROADMAP.md). |

## Ecosystem fit

Nook answers the question *"What did it cost?"* in the Five Questions model (see [ecosystem.md](ecosystem.md)). It consumes Allay's token accounting and Reaper's audit trail, aggregates across sessions, and writes back to a per-project ledger.

## Until it ships

- Track progress in [ROADMAP.md](ROADMAP.md).
- Discuss design in [GitHub Discussions](https://github.com/enchanted-plugins/nook/discussions).
- Report bugs against the planned interface only if you've read the source — the public API isn't stable yet.
