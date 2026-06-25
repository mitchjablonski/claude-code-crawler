# Increment 28 — Best-run / personal best

**Branch:** `evo/28-best-run` → base `evo/27-title-polish` (stacked)
**Pillar:** E (engagement / chase loop) · **Commit:** `c96a728`

## What it does
Closes the chase loop now that #25 tracks run-stats: every run gets a SCORE, persisted
in run history, and GameOver shows the player's **personal best** for that
(character, mode) — **`NEW BEST!  <score>  (prev <old>)`** when beaten (or first run),
else **`Score <score> · Best <best>`**.

- `runScore(state)` — pure, monotonic; reuses the shipped `dailyScore` formula
  (`floors*50 + ⌊gold·0.5⌋ + hp + relics*25 + won*500`) so daily + non-daily share one
  scale. `dailyScore` itself is byte-identical (recorded daily scores don't shift).
- `bestRun(meta, {character, mode})` — max score among PRIOR matching records.
- Every finished run records `score` (was daily-only); the daily date folds into a muted
  tag under the unified score line.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **297 tests** ✅ (runScore purity/monotonicity; bestRun cases; NEW BEST first/record/non-record; daily coexistence; pre-#28 score-less migration)
- `play-verify` **PASS**; empty `src/engine/` + `saves.ts` diff (META + UI only)
- victory.png: `NEW BEST!  1036` (green) atop the run-report; injected one-offs show `(prev N)` and `Score · Best`

## Persistence / determinism
No `RunState` shape change → no `SAVE_VERSION` bump. `RunRecord.score` already existed
(E2/E3) → `META_VERSION` stays 2, additive + back-compatible. **E2 migrate-not-wipe
preserved**: old score-less records still load and don't count as a best. NEW BEST
compares the PRIOR best (App drops the just-appended run) — no off-by-one. `runScore` pure.

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / persistence | PASS | No SAVE_VERSION; dailyScore byte-identical; META migrate-not-wipe; prior-best ordering correct; pure. |
| Design / visual | PASS | Closes the chase loop; NEW BEST rewarding + clear; daily coexists; theme-tokenized. |

### Deferred → backlog (nits + queue)
`useMemo` the priorBest derivation (perf nit); surface per-(character,mode) best on the
title; a best-run history screen; optionally fold #25 stats into the score.
