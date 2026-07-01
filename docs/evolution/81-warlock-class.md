# Increment 81 — The Warlock class + kit (epic B)

**Branch:** `evo/81-warlock-class` (stacked on `evo/80`) → base `main` · **Commit:** `0717c9e`
**Pillar:** content epic. Warlock epic 2/4 — the class, built on A's `lifesteal` + `hex` primitives.

## The class
- **Warlock**, maxHp **56** (lowest of the four — a fragile body kept alive by draining/hexing).
  Tagline: *"Drains enemies to heal and hexes what won't die. Your HP is a shared resource now."*
- **Starter deck (9):** 3 shortsword, 3 buckler, 2 `siphon-fang` (drain), 1 `curse-brand` (hex) —
  both levers open turn one. **Starter relic** `siphon-sigil` (combatStart: hex all enemies).

## Kit (13 draftable + `-plus` + 2 relics)
- **Drain attacks** (`lifesteal 0.5`): drain-touch, vampiric-slash (+draw), soul-drain, soul-harvest (R).
- **Hex curses**: wither (0-cost 3 hex), hex-lash, hex-nova (AoE), doom-hex (R, AoE hex + energy).
- **Curse→drain payoffs** (`conditional targetHasStatus hex`): hex-feast, hex-siphon, hex-reaper (R,
  +12 if hexed) — the "curse then drain" loop.
- **Relics**: siphon-sigil (starter), vampiric-idol (onKill: heal 3).
- scoreCard + combatValue taught drain (amount×lifesteal×heal-value) + hex (poison-shaped DoT + siphon).

## Balance — parity + NOT unkillable (the key risk, reviewer-reproduced)
- **All 4 classes single-mode MCTS parity = 1.0.**
- **Unkillable check: grind-not-facetank.** Warlock greedy nightmare 0.935 (BELOW knight 0.985);
  avgEndHpOnWin ~53–55% of max and DECREASES as difficulty rises (65%→53%) — the signature of
  spending HP, not face-tanking (MCTS drives it to 29%). Sustain earns tough fights.
- Picks contested; the two rares (soul-harvest 0.94, hex-reaper 1.0) sit inside the existing top-rare
  band, not new degenerate must-picks. Cross-class not warped (shared-pool cards; knight/apothecary/
  overclocker stay class-typical). Tuning: buffed 2 dead commons, trimmed the 2 auto-pick rares.

## Determinism / saves
Additions only — existing content byte-identical; `run(seed)===run(seed)` holds. **SAVE_VERSION
unchanged (12)** (cards/relics/character = ids).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **497 tests** ✅ (warlock kit/pack/relics/winnable-shape + 3 scoreCard tests) · scorer tests 23 ✅ · `play-verify` PASS
- Review — 1 lens, **0 blocking** — PASS (unkillable=grind, parity, cross-class safe)

## Deferred to C/D
warlock enemy that hexes the PLAYER (exercises the player-hex path); add `warlock` to play-verify's
balance matrix; warlock events + class-select/hex HUD legibility.

## Next
A drain+hex → B class (this) → **C new act "Corrupted Core"** → D events/legibility + final sweep.
