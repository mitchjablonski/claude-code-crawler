# Increment 63 — The Overclocker class + kit (Overclocker epic, B)

**Branch:** `evo/63-overclocker-class` (stacked on `evo/62-overheat-engine`) → base `main`
**Commits:** `b118543` (class + kit) + tweak (review nits) · **Pillar:** D (depth) / content epic.

## The class
**Overclocker** — reckless tech-aggro glass cannon ("Crashes optional."). maxHp **60** (fragile;
the self-damage lowers effective HP, so 60 avoids a death-spiral). Starter relic **`overclock-chip`**
(replaces the generic pocket-dice → one starter relic, parity). 9-card starter deck (4 shortsword,
2 buckler, + the two kit starters: Vent Heat = overheat tempo, Meltdown Jab = gradient) so both
levers are taught turn one.

## Kit
- **13 draftable cards + 8 upgrade variants**: overheat tempo (reckless-swing, thermal-vent,
  power-spike), gradient crits (meltdown-strike, overload-blast, critical-mass), gradient block
  (coolant-surge, frost-plating, emergency-coolant), sustain to offset overheat (feedback-loop,
  siphon-capacitor). Built on increment A's `loseHp` + `scaleMissingHp`.
- **2 relics**: `overclock-chip` (starter — combatStart: lose 2 HP, +1 energy) + `redline`
  (draftable elite, turnStart + hpBelow 50 → +1 Strength).
- **scoreCard + combatValue** taught the new primitives (loseHp = modest cost; scaleMissingHp at a
  moderate assumed-missing-HP estimate) so greedy drafts/plays the class honestly.

## Balance (reviewer-confirmed, re-run)
- **Single-mode MCTS parity = 1.0 (= Knight)** — the arbiter. Greedy single normal/hard/nightmare
  ≈ 0.98 / 0.91 / 0.74 (Apothecary tier). NOT a death-spiral (hard/nightmare in peer range).
- NOT a nuke: biggest hit critical-mass+ ~25 only at ~1 HP, under guillotine-plus 32.
- Cross-class: Knight/Apothecary stay at parity with the new shared-pool cards (only offer-sets
  shift; existing cards byte-identical). No degenerate cross-class combo.
- **Known gap → increment C:** the class ships ZERO AoE, so arc/multi-enemy lags (greedy arc normal
  ~0.82) — an acceptable design gap, deferred (a capped AoE gradient option in C).

## Review nits (2 low, 0 blocking) — handled
- **feedback-loop** buffed 7→8 dmg (greedy pick 0.11 → **0.23**, off the floor).
- **overdrive-core** kept at cost 1: greedy auto-picks it, but that's a SYNERGY-BLIND greedy
  artifact (its self-damage fuels gradient cards — real upside greedy can't see), and the review
  confirmed it does NOT move other classes' win-rate. Cost 2 made it strictly worse than
  berserker-brew and DEAD in greedy — a worse outcome. Documented; a future "convert HP-loss to
  Strength" redesign would make it class-asymmetric for real. (Consistent with the MCTS-is-arbiter
  insight: greedy pick-rate misleads for synergy cards.)

## Determinism / saves
Only ADDITIONS (existing cards/relics/characters byte-identical); `run(seed)===run(seed)` holds;
adding shared-pool content shifts which cards seeded runs OFFER (expected). **SAVE_VERSION unchanged**
(decks/relics/character serialize as ids). The `times>1` + `scaleMissingHp` guard (carried from A)
is enforced by a content.test assertion.

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **414 tests** ✅ (quota+kit incl. overclocker; guard; winnable-shape run; App cycle now 3 classes) · `play-verify` PASS
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS (both nits handled above)

## Next
C = thematic overheat event(s) + critical-state legibility (HUD shows missing-HP/heat) + optional
capped AoE for arc parity + final sweep + epic summary.
