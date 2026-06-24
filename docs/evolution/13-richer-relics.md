# Increment 13 — D4: Richer relics

**Branch:** `evo/13-richer-relics` → base `evo/12-screen-chrome` (stacked)
**Pillar:** D (depth) · **Commits:** `ddcdf36` (impl), review-fix commit follows

## What it does
Adds new relic trigger points + a light conditional for real build variety.
`RelicTrigger` extended to `combatStart | turnStart | onCardPlayed | onKill`, plus an
optional `condition: { hpBelow, pct }` comeback gate (pure, reads combat HP only).

New triggers fire at the `playCard` chokepoint (no deep threading into effects.ts):
snapshot living enemies before the card → apply effects → fire `onKill` per enemy
killed → fire `onCardPlayed` once.

**6 new relics** (pool 12→18): Bloodthirster (onKill +1 Str), Gravedigger's Glove
(onKill draw 1), Reaper's Tithe (onKill heal 3), Tempo Band (onCardPlayed +1 Block),
Cornered Instinct (turnStart, <50% HP → +6 Block), Last Ember (turnStart, <40% HP →
+1 Str).

## Determinism (the core invariant)
The new firing sites are **no-ops — no rng, no state change — for any player who
owns no matching relic**, so existing runs (starter relics are all
combatStart/turnStart) stay **byte-identical**. `applyRelics` consumes rng only
inside an applied (matching + condition-met) relic's effects. No `SAVE_VERSION`
change (`RunState.relics` still `string[]`). Proven by a dedicated test: a
no-matching-relic `playCard` deep-equals the pre-D4 path at the same rng seed.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **208 tests** ✅ (onCardPlayed, onKill single + AoE per-kill, hpBelow gating, the byte-identical determinism test, trigger/condition validation)
- `play-verify` **PASS**; all feature flags true
- balance (greedy@300, normal+hard, both chars): all deltas vs baseline ≤0.023 — flat

## Review — 3 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / determinism | PASS | No-op invariant verified + load-bearing (an onKill draw-relic touches the stream); kill-detection counts each death once, AoE per-kill, order correct. |
| Balance / fairness | PASS | Per-trigger numbers are minimum-viable (≤ shipped relics); acquisition bounded (elite-only + deduped → ~0-2 single, 2-4 arc). |
| Design | PASS | Clean trigger/condition extension at the right chokepoint; 6 relics create distinct incentives; pool 12→18 makes elite rewards more exciting. |

### Findings addressed
1. Added a doc pointer on `RelicTrigger` listing where each trigger fires (sites span combat.ts + run.ts).
2. Queued backlog **D9**: `onCombatEnd` (post-fight heal/gold — needs run-level effect application; higher-value next) + `onShuffle`; richer conditions only when a relic concept demands them.

### Deferred → D9
`onShuffle`/`onCombatEnd` triggers (run-level/deeper threading); generalized conditions.
