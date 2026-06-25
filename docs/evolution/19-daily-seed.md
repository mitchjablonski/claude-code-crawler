# Increment 19 — E3: Daily seed / challenge

**Branch:** `evo/19-daily-seed` → base `evo/18-git-push` (stacked)
**Pillar:** E (engagement) · **Commits:** `e298fcb` (impl), review-fix commit follows

## What it does
A **Daily Challenge**: a deterministic seed-of-the-day everyone shares, with a score.

- `dailySeed(nowMs)` → `daily-YYYY-MM-DD` (UTC; pure over the injected timestamp — no
  wall-clock in the engine). Fixed canonical config (normal / single / knight) so the
  seed yields a byte-identical run for everyone → comparable scores.
- `dailyScore(state)` — pure, deterministic, monotonic: `floors*50 + floor(gold*0.5) +
  hp + relics*25 + (won?500:0)`.
- Title `[t] Daily YYYY-MM-DD (best: N)` launches it; GameOver shows the daily score.
- Recorded via additive optional `RunRecord.daily`/`score` (no save-version bump; meta
  migrates). Daily tag held in UI state (no RunState bump).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **262 tests** ✅ (UTC seed determinism + day-boundary; same-ms run byte-identical; score determinism + monotonicity; daily RunRecord round-trip; `bestDailyScore`)
- `play-verify` **PASS**; all feature flags true; empty `src/engine/` diff (no reducer change); SAVE_VERSION (8) + META_VERSION (2) unchanged
- title.png: daily line renders cleanly in the chrome

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / determinism / persistence | PASS | No engine change; no banned clock; UTC seed + monotonic score verified; additive fields, meta still migrates. |
| Design / UX | PASS-WITH-NITS | Fixed-config is the right call for comparable scores; clear surfacing. |

### Findings addressed
1. Weighted the gold term (`floor(gold*0.5)`) so a no-shop hoard can't rival a thin victory (strict monotonicity preserved); updated the formula test.

### Deferred → backlog
"Already played today" state (currently re-rollable), a streak counter, a copy-seed share affordance, persisting the daily tag through save/resume (would need a SAVE_VERSION bump), and daily-specific GameOver flavor.
