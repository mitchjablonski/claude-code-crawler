# Increment 45 — Poison-payoff card (playtest-driven; uses the #42 conditional kind)

**Branch:** `evo/45-poison-payoff` → base `main` · **Commit:** `7b0bcf6`
**Pillar:** D (balance). First card to leverage batch 14's conditional-effect kind.

## Why
Apothecary trailed knight at single/nightmare (~+7.7pp) + arc/nightmare (~+9pp) — poison
ramps too slow for the long high-HP boss. Added a **poison-payoff** card that's strong WITH
poison (apothecary) and ordinary without (knight), closing the gap with no class-gating.

## What it does (content-only)
**Venom Reprisal** — uncommon, cost 1, attack, draftable (both classes):
`5 dmg + conditional(target poisoned → +5 dmg & +2 poison)` (`-plus`: 6 + (poison → +7 & +3)).
Cold it's a weak 5-dmg/1; set up it's ~10 dmg + 2 poison — accelerating the slow ramp.
Only ADDS poison on the payoff (never consumes/detonates) → no compounding one-shot.

## Result (greedy@600 nightmare — gap = knight − apoth)
| cell | gap before → after |
| --- | --- |
| single/nightmare | +0.075 → **+0.047** (apoth 0.377→0.415) |
| arc/nightmare | +0.075 → **+0.040** |
normal/hard undistorted. MCTS pickRate: apothecary > knight (class-split real), ≤0.30 (not
dominant). No overshoot (apoth stays below knight), no degenerate cell, poison decays 1/round.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **357 tests** ✅ (content.test validates the nested card + that payoff adds, never consumes, poison)
- `play-verify` PASS; content-only (`cards.ts` + `content.test.ts`); no engine/SAVE_VERSION; uses existing #42 conditional; determinism byte-identical

## Review — 1 balance lens, 0 blocking
PASS-WITH-NITS: gap narrowed without overshoot; class-split real; not dominant; no poison loop; calibration fair vs peers.

### Nit → backlog
Gap narrowed but not fully closed (~0.04 residual). Safe partial close; a future lever
(+1 payoff poison, or a 2nd poison-payoff card) only if a later matrix still shows a
meaningful residual. (Also: greedy `scoreCard` is class/deck-blind, so the class-split shows
in combat win-rate + MCTS pickRate, not greedy draft — read MCTS for the class signal.)
