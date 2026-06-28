# Increment 64 — Overclocker polish + epic summary (Overclocker epic, C)

**Branch:** `evo/64-overclocker-polish` (stacked on `evo/63` → `evo/62`) → base `main`
**Commit:** `7bdbd01` · **Pillar:** content epic (final increment).

## What C adds
1. **`chain-reaction`** (rare, cost 2, allEnemies, gradient AoE: 8 dmg +1 per 6 missing HP) — the
   class's only AoE, closing the arc/multi-enemy gap. allEnemies-only (never a single-target nuke),
   no `times` (guard holds), contested pick (0.81, below avalanche's 0.99). Lifts overclocker arc
   +3–4pp; single flat.
2. **Two overheat events** (class-agnostic, overheat-flavored): *Overclock Altar* (+6 maxHp / −4 HP;
   a risky redline gamble; safe exit) and *Coolant Reservoir* (gold→+maxHp; a relic-for-HP trade;
   safe exit). Each keeps an ungated option (anti-stall). Greedy-default options are net-positive +
   class-agnostic (fixed a first-iteration cross-class regression).
3. **HP "heat" legibility**: `hpTint(hp,maxHp)` + theme tokens `hpHealthy`/`hpWarning`/`hpCritical`
   — the player HP readout warms (green→yellow→red) as HP drops, so the gradient is felt. Doubles as
   a universal low-HP alarm. Theme tokens only, color-only (budget unchanged), maxHp=0-safe.

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **421 tests** ✅ · `play-verify` PASS · existing content byte-identical · **SAVE_VERSION unchanged** · `run(seed)===run(seed)` holds
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS (only nit: hard-arc OC trails — a characterful glass-cannon trait, see below)

---

# The Overclocker epic — summary (increments 62–64)

A **third playable class** (human-designed via deepPairing), built on two small pure engine
primitives, reaching **single-mode MCTS parity** with Knight and Apothecary.

| inc | PR | what |
|-----|----|------|
| 62 (A) | engine | `loseHp` (floor-1, unblockable) + `scaleMissingHp` gradient on damage/block — pure, no SAVE_VERSION bump, existing runs byte-identical |
| 63 (B) | class | Overclocker (maxHp 60, "Crashes optional."), starter deck + `overclock-chip`, 13-card pack + 8 upgrades + `redline`; scoreCard/combatValue taught the primitives |
| 64 (C) | polish | `chain-reaction` AoE (arc gap), 2 overheat events, HP-heat legibility |

**Identity:** reckless glass cannon — pay HP ("overheat") for tempo; cards scale continuously with
missing HP (a gradient, per the design decision); heal back between fights (pairs with the
onCombatEnd relics from #59).

**Balance:** single-mode MCTS = 1.0 (= Knight, the arbiter). Greedy 3-class parity holds; no
death-spiral (single hard/nightmare in peer range), no nuke (gradient capped under existing
ceilings). Cross-class safe (shared-pool additions don't warp Knight/Apothecary; only offer-sets
shift; existing content byte-identical). **Known characterful trait:** the class is weakest at the
HARDEST arc/multi-enemy cell (hard-arc greedy ~0.66) — on-theme for a high-variance glass cannon
that struggles in grindy attrition; a future tuning lever if desired, not a defect.

**Determinism/saves:** SAVE_VERSION stayed 11 throughout — effects/cards/relics/character all
serialize as ids; the whole epic added zero persisted shape.

## Merge order (3 stacked PRs, never auto-merge)
**A → B → C.** Each is CI-gated; A off main, B off A, C off B.
