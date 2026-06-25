# Increment 24 — Event outcome hints (playtest-driven)

**Branch:** `evo/24-event-hints` → base `evo/23-postrun-summary` (stacked)
**Pillar:** E (engagement/agency) · **Commit:** `2ce51ff`

## Why
UX playtester: event options were mystery boxes ("(risky)" with no stakes) → no agency.
Now each option shows an **outcome hint** derived from the static event data.

## What it does (pure UI; reveals stakes, not the roll)
`optionHintSegments(outcomes, content)` renders a compact, theme-tokenized sub-line per option:
- **Deterministic** outcomes → concrete (`+15g, -2 HP`).
- **`rollOutcomes`** (gamble) → min..max RANGE per dimension (`+0..+55g, -8..+0 HP`) — exposes the stakes WITHOUT picking a branch, so the roll's suspense is preserved.
- **`conditional`** → gate + both clauses (`if relics>=3: -2 HP else -9 HP`).
- card/relic → resolved NAMES (`+Lucky Dagger`); present-in-some-branches → `(maybe)`.
- Empty-outcome option ("Walk away") → no hint. Gains success / losses danger / neutral muted.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **279 tests** ✅ (9 new: deterministic, roll-range, conditional, card/relic names, "maybe", empty→none, id-leak guard, render tests)
- `play-verify` **PASS**, `eventResolved: true` (autoplayer events still work); empty `src/engine/` diff (pure UI)
- event.png + risk/conditional/gated one-offs: hints render color-coded, ≤76 cols, gated row keeps its `(need N gold)` reason + hint

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / scope | PASS | Pure UI (2 files, types-only engine import); helper takes only (outcomes, content) — no rng/resolver → range-not-roll confirmed; no regression. |
| Design / visual | PASS | Restores agency at the right agency/suspense balance; legible, cohesive with the E1 result styling; edge cases clean. |

### Deferred → backlog
Weighted-roll odds (the `weights` are invisible — e.g. vending machine's `[1,2,1]` means +20g is 2× as likely); an optional exact-vs-range reveal toggle.

## Batch eight complete
#22 (dead-card balance), #23 (post-run summary), #24 (event hints) — PRs #22/#23/#24.
**All three driven directly by the Sonnet playtesters' validated findings.**
