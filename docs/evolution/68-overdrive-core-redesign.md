# Increment 68 — Overdrive Core class-asymmetry redesign

**Branch:** `evo/68-overdrive-redesign` → base `main` · **Commits:** `29e5d3c` + `477e8b9`
**Pillar:** D (depth). The honest fix for the synergy-blind greedy artifact flagged back in #63.

## Why
`overdrive-core` (old: "lose 3 HP, gain 3 Strength") greedy-AUTO-PICKED across ALL classes — but its
self-damage is real upside only for the Overclocker. Greedy couldn't see that, so it was a
cross-class auto-pick (a synergy-blind artifact, no real win-rate impact). Make it genuinely
class-asymmetric so it's strong for the Overclocker and useless for Knight/Apothecary.

## What it does (engine + content + UI)
- **New `overcharge` status** (permanent power, like strength — excluded from `decayStatuses`).
- **loseHp hook** (effects.ts `case 'loseHp'`): after flooring HP at 1, if `overcharge > 0` gain
  `overcharge`-many Strength. Pure (no rng), strict no-op at 0 (existing overheat runs byte-identical),
  and **self-inflicted only** — enemy damage flows through `hitPlayer`, which never touches it. THIS
  is what makes it class-asymmetric: it's inert without `loseHp` (overheat) cards.
- **Reworked `overdrive-core`** (rare, cost 1, power): "Power: whenever you overheat (lose HP), gain
  1 Strength" → `applyStatus overcharge 1`.
- **Display:** `overcharge` renders in the HUD via the `heat` theme token (glyph `OVC`).
- **scoreCard/combatValue:** value overcharge by deck synergy — scoreCard scales it by the number of
  `loseHp` cards in the deck (0 for Knight → it's near-worthless; rises into a top rare in an
  overheat deck), so greedy drafts it honestly and sweeps don't lie.

## Result (reviewer re-confirmed)
- **De-dominated cross-class:** greedy@200 now picks it **0** for knight/apothecary/overclocker
  (was ~1.0 for all); win-rates unchanged (1.0 / 0.99 / 0.97).
- **Overclocker parity holds:** MCTS single = 1.0. Bounded (Strength = stacks × #overheats/fight —
  not a one-shot nuke).
- **Scorer is synergy-gated:** empty deck 0.00 → knight 1.10 (dead-last rare) → overheat decks
  4.10 → 10.10 → 19.10 → 31.10 as loseHp count rises (1/3/6/10). Class-asymmetric by construction.
- Honest note (reviewer nit, non-blocking): greedy still picks it ~0 even for the Overclocker (it's
  offered before overheat density accrues — a 1-ply offer-timing limitation, not an imbalance); MCTS,
  the arbiter, keeps parity.

## Determinism / saves
loseHp hook is pure → `run(seed)===run(seed)` holds. overdrive-core changed (shifts its own seeded
runs — expected); all other cards byte-identical. `overcharge` is a new OPTIONAL key in the
`Partial<Record<StatusId,number>>` status maps → no serialization-shape change → **SAVE_VERSION
unchanged (11)**; old saves read the missing key as 0.

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **433 tests** ✅ (+7: overcharge grants Strength on loseHp, stacks over
  multiple overheats, no-overcharge no-op, rng-unchanged, enemy-damage-does-NOT-trigger, no-decay,
  overdrive-core effect set) · scorer tests 20 ✅ · `play-verify` PASS
- Review — 1 lens, **0 blocking** — PASS

## Batch 24
#69 overdrive-core redesign (this). The map event-naming decision is also in flight (deepPairing
design call — Tiered reveal recommended; awaiting the human's pick).
