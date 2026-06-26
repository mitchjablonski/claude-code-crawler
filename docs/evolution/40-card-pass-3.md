# Increment 40 — 3rd card pass: lucky-dagger + weak commons

**Branch:** `evo/40-card-pass-3` → base `main` · **Commit:** `8d2648d`

## Why
MCTS-confirmed weak cards (greedy pickRate unreliable for these — the #39 scorer over-values
burst, so MCTS is the arbiter): `lucky-dagger` still dead after #31; `twin-jab`/`pommel-strike`
bottom-third commons.

## What it does (content-only; existing effects)
| Card | Before | After |
| --- | --- | --- |
| lucky-dagger (rare) | 12 dmg + draw 1 /2 | **11 dmg + draw 2 /2** (card-advantage rare; +`-plus` 14 dmg + draw 2) |
| twin-jab (common) | 3 dmg ×2 /1 | **4 dmg ×2 /1** |
| pommel-strike (common) | 4 dmg + draw 1 /1 | **6 dmg + draw 1 /1** (+`-plus` 9 dmg + draw 1) |

lucky-dagger's intended "×2 if poisoned" needs a conditional-effect kind the engine lacks →
redesigned non-conditionally into a draw-engine rare instead.

## Result (MCTS@100 pickRate — the arbiter)
- lucky-dagger: arc/knight 0.10→**0.23**, arc/apoth 0.16→0.21 (lifted into peer band where
  card-advantage pays off; single-act cells stay modest — short MCTS horizon undervalues
  draw-2 in one act; not dominant anywhere)
- twin-jab: in commons band (arc/apoth 0.16→0.33); pommel-strike: 0.08→0.16, arc 0.18→0.25
- No card dominant (all ≤~0.35); win-rates non-degenerate; determinism byte-identical (normal).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **332 tests** ✅ (no fixture changes)
- `play-verify` **PASS**; single-file diff (`cards.ts`); no engine/SAVE_VERSION change

## Review — 1 balance lens, 0 blocking
PASS: lifted without overshoot; lucky-dagger acceptably improved (arc/apoth the trustworthy signal); commons in band; calibration fair vs peers; content-only, invariants + determinism intact.

### Deferred → backlog
- **whirlwind** left alone (MCTS-dead in single, fine in arc — mode-conditional BY DESIGN); a single-target damage floor would need an engine conditional-effect kind.
- **Conditional-effect engine support** would unlock the better designs (lucky-dagger ×2-if-poisoned, whirlwind single-target floor) — a candidate future engine increment.
