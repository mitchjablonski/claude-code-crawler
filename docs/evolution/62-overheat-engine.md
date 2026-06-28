# Increment 62 — Overheat engine primitives (Overclocker epic, A)

**Branch:** `evo/62-overheat-engine` → base `main` · **Commit:** `cb457ab` · **Pillar:** D (depth).
First of three increments for the human-approved **Overclocker** content epic (a reckless self-damage
glass-cannon class). This increment is ENGINE-ONLY — no content yet.

## Why
The Overclocker pays its own HP for power ("overheat") and its cards scale CONTINUOUSLY with missing
HP (a "gradient", per the design decision — not a binary threshold). Two pure primitives express the
whole archetype without new combat state (so no SAVE_VERSION bump).

## What it adds (pure, rng-free)
1. **`loseHp`** effect — `{kind:'loseHp', amount}`: unblockable direct HP cost, **floors at 1**
   (a self-cost can never be lethal; the risk is fragility vs the enemy's next turn). Player-only.
2. **`scaleMissingHp?`** optional divisor on `damage`/`block` — amount gets
   `+ floor((playerMaxHp - playerHp) / scaleMissingHp)`, folded into the per-hit base BEFORE the
   strength/vulnerable (damage) or dexterity (block) pipeline. 0 at full HP / when absent. The
   gradient: hits harder the more hurt you are.

## Determinism + saves
- Both rng-free; no existing card uses either → existing seeded runs BYTE-IDENTICAL (a new test
  asserts an existing-kinds fight, incl. `times`, is byte-identical including final rng state).
- **SAVE_VERSION unchanged** (effects are static content; RunState serializes ids).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **413 tests** ✅ (+10: loseHp floor/unblockable/no-rng; scaleMissingHp gradient on damage+block, 0 at full HP, no-rng; inert-for-old-content byte-identical) · `play-verify` PASS
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS

## Carried to increment B
- Enforce (not just comment) that no card carries BOTH `times>1` and `scaleMissingHp` (content-test guard) — the only nit.
- scoreCard valuation of loseHp (cost) + scaleMissingHp (payoff) — needed once cards exist.

## Next
B = the class (CHARACTERS 'overclocker' + starter deck + Overclock Chip relic + ~12–15 card pack +
Redline relic) + balance/MCTS. C = overheat events + critical-state legibility + final sweep.
