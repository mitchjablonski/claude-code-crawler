# Increment 39 — Smarter playtest draft policy (tooling)

**Branch:** `evo/39-draft-policy` → base `main` (first increment of the post-merge, PR-to-main workflow) · **Commit:** `3ca4c4f`

## Why
The greedy playtest policy drafted reward cards with a blind `index: 0`, so greedy
`pickRate` measured offer ORDER, not card value — uncorrelated with MCTS, flagged noise in
every balance playtest. Gave greedy a heuristic scorer so `pickRate` becomes a real, cheap
card-value signal (no full MCTS needed for every sweep).

## What it does (TOOLING ONLY — no `src/**` change)
`scoreCard(card, deckCtx)` (pure, deterministic, `scripts/lib/scoreCard.ts`):
`value = Σ effectValue / max(0.7, cost) × rarityWeight + small deck-need nudge`
- rarity weight (starter .6 < common 1.0 < uncommon 1.35 < rare 1.8, dominant)
- effect value (damage/block per energy, draw 2.2, gainEnergy 3.0, status per-stack, heal; AoE ×1.4)
- cost efficiency; bounded deck-need nudge that never dominates rarity.
Greedy reward pick now chooses the highest-scored offered card (lowest-index tie-break);
MCTS path + tallying unchanged.

## Result — signal went from noise to real
- pickRate spread ~5× wider (std 0.065→0.341; now spans 0→1.0)
- MCTS correlation flipped **−0.32 → +0.32** (old policy was anti-correlated)
- strong rares (guillotine/viral-load/corrosive-mist) now top-picked; weak commons
  (limber/second-breakfast) correctly dropped to 0.

## Known limitation (accepted)
The heuristic over-values raw single-target burst (e.g. lucky-dagger 0.9 greedy vs MCTS
0.13). It's approximate-but-correlated, not optimal — **MCTS remains the arbiter for such
cards.** Good enough to trust fast greedy sweeps for dominant/dead-card direction.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **337 tests** ✅ (5 new scoreCard tests: rare>common, efficient>dead, AoE>single, cheaper>pricier, deterministic)
- `play-verify` **PASS**, non-degenerate; no `src/**` change (shipped game untouched)

## ⚠️ New baseline note
A smarter drafter wins more — greedy win-rates are now **higher** (single ~0.88) and **NOT
comparable to pre-#39 greedy numbers**. Future balance sweeps should re-baseline.

## Review — 1 focused lens, 0 blocking
PASS: tooling-only, pure/deterministic, weights sane, signal demonstrably improved, win-rates non-degenerate.
