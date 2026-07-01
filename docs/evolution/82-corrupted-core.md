# Increment 82 — "Corrupted Core" act (Warlock epic C)

**Branch:** `evo/82-corrupted-core` (stacked on `evo/81`) → base `main` · **Commits:** `00b4a0a` + `e1a42e8`
**Pillar:** content epic. Warlock epic 3/4 — a new deepest ARC act.

## What it adds
- **ARC_ACTS 3→4** (`config.ts`): a new deepest act, **"Corrupted Core"** (act 3, boss act). Single
  mode stays 1 act (act 0). Extended the HP ramp (act-3 = 1.30 nightmare) + a 4th rarity row
  (richest); act-0 scalar still exactly 1.0.
- **Act-aware boss selection** (`bossPoolForAct` in run.ts): act 0-2 → `the-scope-creep` (single-elem
  pool → identical draw), act 3 → `the-corrupted-core`.
- **Elite spawns now tier-gated** (`tier<=act+1`) — previously ungated; the fix that keeps new tier-4
  elites out of act 0 (a provable no-op for existing elites, all default tier 1).
- **4 tier-4 enemies**: core-sentinel (tanky bruiser), **hex-daemon (applies `hex` to the PLAYER** —
  first content to exercise increment A's round-end player-hex DoT), data-rot (poison/corruption),
  corrupted-overseer (phased ELITE). **New boss `the-corrupted-core`** (phased: base stall → "Total
  Corruption" meltdown; pressures sustain via player-hex + escalating strength, with breather beats).
- **play-verify balance matrix now sweeps all 4 classes** (was knight/apothecary only).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **502 tests** ✅ (+5: tier-gating excludes tier-4 from act 0/1/2; act-3
  admits them; deterministic boss pool; hex-daemon + boss hex the player; boss signature move) ·
  `play-verify` PASS (4 classes)
- **SINGLE-MODE BYTE-IDENTICAL confirmed** (reviewer, two proofs: static tier-gating no-op + empirical
  seeded greedy digest `diff`-identical vs parent for all 4 classes).
- **Arc balance sane** (greedy@150 arc): no crater; boss fair (1–15 deaths/150, a real wall not a
  pushover); Warlock strongest but loses ~10% nightmare (not unkillable). Lowest cell: apothecary
  nightmare-arc ~55% (block-light class punished by block-bypassing hex — thematically apt, still
  winnable; monitor in D's final sweep). Tuned act-3 ramp + boss HP down to smooth the dip.
- Review — 1 lens, **0 blocking** — PASS. Determinism holds; **SAVE_VERSION unchanged (12)** (map is
  generated nodes; enemies serialize by defId).

## Next
A drain+hex → B class → C new act (this) → **D events/legibility + final 4-class sweep** (watch
apothecary nightmare-arc; the hex=blue chip shares `weak`'s hue — revisit legibility).
