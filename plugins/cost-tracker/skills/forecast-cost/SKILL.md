---
name: forecast-cost
description: >
  Computes L1 Exponential Smoothing forecast over the current session's ledger to project
  end-of-session, end-of-day, and end-of-month spend with ±2σ confidence bands. Use when:
  /pech-forecast slash command fires, or an anomaly in L3 requires the current trajectory
  for narrative context. Do not use for raw totals (see /pech-cost → cost-display) or for
  threshold checks (see budget-watcher).
model: sonnet
tools: [Read, Write]
---

# forecast-cost

## Preconditions

- At least 3 ledger rows exist in the current session (forecasting a single-call series is noise)
- `shared/rate-card.json` is loaded (for forward-rate assumptions)

## Inputs

- **Argument:** optional scope `--session` (default), `--day`, or `--month`
- **Ledger:** `state/ledger-YYYY-MM.jsonl` read tail-first for performance

## Steps

1. Aggregate ledger rows into a time-bucketed series matching the requested horizon:
   - `--session`: per-call cost, time index = call sequence number
   - `--day`: hourly cost roll-up over current day
   - `--month`: daily cost roll-up from `state/rollups/daily-*.json`
2. Initialize `ŷ_0 = y_0` (first observation). Iterate:
   ```
   for t in 1..len(series):
       ŷ_t = 0.3 * y_{t-1} + 0.7 * ŷ_{t-1}
   residuals = [y_t - ŷ_t for t in 1..len(series)]
   σ = stdev(residuals)
   ```
3. Project one step ahead: `forecast_next = ŷ_last`. Multiply by remaining-step count (calls remaining in session, hours remaining in day, days remaining in month) to get horizon total.
4. Report: `forecast ± 2σ`. Never emit a point estimate without the band.
5. Write forecast result to `state/session.json#forecast` for status-line consumers.

**Success criterion:** forecast JSON written with `{horizon, point_estimate, sigma, lower_band, upper_band, n_observations}`. If `n_observations < 3`, return `{insufficient_data: true}` — never fabricate a forecast from noise.

## Outputs

- `state/session.json#forecast` — forecast block for the requested horizon
- Stdout: human-readable summary for developer display (only when invoked via `/pech-forecast`)

## Handoff

`cost-query/cost-display` skill reads the forecast block to render the developer-facing view.

## Failure modes

| Code | Scenario | Counter |
|------|----------|---------|
| F11 | Hit the "looks good" metric by dropping high-residual observations | Residuals are inputs, not nuisance; retain all |
| F13 | Pad forecast output with marketing phrases ("you're on track!") | Report number + band; narrative is Opus's job at `/pech-report` time |
| F14 | Use a stale α without noting rate-card drift influence | If `rate_card_stale: true` in any underlying row, tag the forecast `rate_card_stale: true` |
