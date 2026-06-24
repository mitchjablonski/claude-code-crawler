# Increment 10 — D5: Boss mechanics

**Branch:** `evo/10-boss-mechanics` → base `evo/09-deck-view` (stacked)
**Pillar:** D (depth) · **Commits:** `72863b2` (impl), review-fix commit follows

## What it does
Bosses (and a showcase elite) get **HP-threshold phase changes** + **signature
moves**, so the climax escalates instead of being a stat-stick.

- Optional `EnemyDef.phases?: EnemyPhase[]` (`{ hpThreshold, moves, name? }`),
  ordered ascending; the active pool is the first phase whose `hpThreshold >=
  hp/maxHp`, else the base `moves`. Pure function of HP — **no rng**, so phaseless
  enemies stay byte-identical.
- A shared pure `resolveEnemyMove`/`resolveEnemyPool` (`src/engine/enemyMoves.ts`)
  drives **both** the combat reducer AND the intent telegraph, so the displayed
  intent always matches the move that will fire — including the instant the boss
  crosses a threshold. The reducer picks the pool once per turn and advances
  `nextMoveIndex` against that same pool length (no index/pool desync across a
  crossing — covered by a deliberate len-2→len-3 test).
- **The Scope Creep** at ≤50% HP enters "Ship It All": drops its 12-block defensive
  stall for an all-offense pool around the telegraphed **"Ship Everything"**
  signature (rallies +1 strength, then 4×3), punctuated by a "Crunch Time"
  block-only breather. **Merge Conflict** (elite) gets a simple ≤40% all-offense phase.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **192 tests** ✅ (phaseless byte-identical via reference identity; phase switch surfaces the signature; index-consistency across a threshold crossing; content phase validation)
- `play-verify` **PASS**; all feature flags true; boss beatable

## Review — 3 lenses (combat-only → visual folded in), 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / determinism | PASS | Phaseless byte-identical (same array ref); pool chosen once/turn, index advances against that pool len; no rng; `startCombat` init unchanged; telegraph == execution. |
| Balance | PASS | Boss winnable + dynamic: single/normal 0.66 (knight) / 0.75 (apoth) — in band; hard dips modestly (0.37/0.48) but non-degenerate; arc parity held. Worst-case burst ~12–15 vs 64–70 HP, with a guaranteed breather. |
| Design | PASS | Clean opt-in phase model + shared resolver; boss genuinely "shifts gears" at 50%; on-tone. |

### Findings addressed
1. Reworded the boss phase comment to match the validated numbers (it had oversold strength escalation; numbers left as-tuned since balance is good).
2. Queued backlog **D8**: phase-entry one-time effects (vs today's pure pool-swap), more phased elites, a first-class `signature` move flag for UI emphasis.

### Deferred → D8
Phase-entry effects, more phased elites, signature-move UI emphasis.
