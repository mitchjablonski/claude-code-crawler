# Increment 23 — Post-run summary (playtest-driven)

**Branch:** `evo/23-postrun-summary` → base `evo/22-card-balance` (stacked)
**Pillar:** V/E (UX) · **Commit:** `ad65207`

## Why
UX playtester: the GameOver screen (`seed / deck / gold`) was too thin to reflect on
or motivate a retry. Enriched it with stats already in `RunState` — pure UI, no engine
change.

## What it does
GameOver is now a labeled run-report (most-meaningful first): outcome banner + snark →
daily score (when daily) → **Depth reached N/M** → **Final HP** → **Deck / Gold** →
**Relics** (by name, christened-or-base, or "none") → **Seed** (shareable id) → actions.
Relic names reuse #21's `relicNames` (App computes; GameOverScreen stays presentational).

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **270 tests** ✅ (5 new: victory/defeat show depth/relics/deck/gold/hp + anchors; "none" path; daily-line on/off)
- `play-verify` **PASS**; empty `src/engine/` diff (pure UI; no turns/damage tracking sneaked in)
- victory.png/defeat.png: clean run-report, theme-tokenized, within the chrome

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Scope / visual | PASS | Pure UI; correct depth/relic derivation; anchors preserved; no overflow; theme tokens. |
| Design | PASS-WITH-NITS | Satisfies the finding; good info hierarchy; deferring turns/damage/kills is correct. |

### Deferred → backlog
- **Engine run-stats** (turns-taken, damage dealt/received, enemies killed) — needs RunState stat-tracking + a SAVE_VERSION bump; the highest-value follow-up (unblocks the richest summary + the daily score could fold them in).
- A **best-run / PB comparison** on victory (deepen the chase loop).
- Act-aware depth (the line is a global row; fold into a per-act breakdown later).
- Relic-line wrap/truncate polish for very long christened lists.
