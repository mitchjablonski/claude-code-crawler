# Increment 25 — Engine run-stats foundation

**Branch:** `evo/25-run-stats` → base `evo/24-event-hints` (stacked)
**Pillar:** D/E (depth) · **Commit:** `8377b27`

## What it does
Tracks per-run **stats** — turns, damage dealt, damage taken, enemies slain — as
DETERMINISTIC passive counters, and surfaces them in the GameOver run-report (#23).
Unlocks a future best-run/PB.

- `RunState.stats {turns, damageDealt, damageTaken, enemiesSlain}` (init 0 in createRun).
- Combat-scoped counters on `CombatState` (`dealt`/`taken`/`slain`; `turn` existed),
  incremented at the real chokepoints: player damage post-block + kills in
  `applyPlayerEffect`; player HP lost post-block in `applyEnemyEffect`.
- **Folded into RunState.stats exactly once at combat resolution — on win AND loss**
  (`foldCombatStats` in `run.ts`), never mid-combat → no double-count, resume-safe.
- GameOver shows `Turns N · Dealt N · Taken N · Slain N` (theme-tokenized).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **287 tests** ✅ (counters correct; fold-once win/loss + no-double-count-in-progress; createRun inits 0; v9 round-trip; v8 quarantine)
- `play-verify` **PASS**; balance non-degenerate (passive — unchanged)
- victory/defeat: `Turns 16 · Dealt 169 · Taken 58 · Slain 6` renders cleanly

## Determinism / persistence
Passive counters — no rng, no combat-math/outcome change (existing determinism +
enemyHpMult tests pass unchanged; stat counters are never read in a combat conditional).
`SAVE_VERSION` 8→9 (v8 quarantines, v9 round-trips); `META_VERSION` untouched (history
preserved). `dailyScore` formula unchanged (recorded daily scores don't shift).

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / determinism | PASS | No behavior change; fold-once win+loss verified; SAVE_VERSION 8→9 clean; dailyScore unchanged. |
| Design / visual | PASS-WITH-NITS | Completes the summary; "Turns/Dealt/Taken" labels slightly unqualified (genre-conventional, left as-is). |

### Deferred → backlog
A **best-run / PB** comparison (persist per-character/mode best, show "NEW BEST"/deltas)
is the natural next step now that stats are tracked + serialized; optionally fold stats
into the daily-score tiebreaker.
