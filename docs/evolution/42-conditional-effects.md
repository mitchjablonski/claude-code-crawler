# Increment 42 — Conditional-effect engine kind (playtest-driven)

**Branch:** `evo/42-conditional-effects` → base `main` · **Commit:** `4d9abe8`
**Pillar:** D (engine/depth) · the fresh playtest's **#1** recommendation.

## Why
The closed `Effect` union had no state-branching, blocking two strong card designs
(lucky-dagger "×2 if poisoned", whirlwind single-target floor) and the apothecary
single/nightmare seam. Added a general conditional effect + used it.

## What it does
- New `Effect` member: `{ kind:'conditional', condition, then:Effect[], else?:Effect[] }`
  with `EffectCondition = targetHasStatus{status,atLeast?} | enemyCount{op,value}`.
- `applyPlayerEffect` gains a `conditional` case: `evalCondition` (pure — reads enemy
  statuses / living-enemy count, no rng) picks `then`/`else`, which RECURSE through the same
  effect path (target resolution + #25 dealt/taken/slain flow into nested effects).
- Applied: **lucky-dagger** 7 dmg + (poison→+7) + draw 2 (`-plus` 9/+9); **whirlwind**
  6 AoE + (enemyCount==1 → +5) (`-plus` 9 AoE + 6).

## Determinism / persistence
Existing cards don't use it → **byte-identical** (`run('alpha')` unchanged; switch is
additive-only). Pure/deterministic eval. **No SAVE_VERSION bump** — effects live in static
content; RunState serializes decks as card-IDs only, never Effect objects (saves.ts
untouched). `applyEnemyEffect` has a safe no-op case.

## Result (MCTS@100 — the arbiter; greedy over-values conditionals)
| cell | lucky-dagger | whirlwind |
| --- | --- | --- |
| single/knight | 0.11→**0.43** | 0.08→**0.25** |
| single/apoth | 0.00→**0.25** | 0.11→**0.19** |
| arc (both) | ~0.20 (flat) | ~0.18 (flat) |
whirlwind single-floor fixes its mode-dead single behavior, arc preserved; lucky-dagger
"good-when-set-up" (rises with poison/draw value, never dominant ≤~0.43). No overshoot/degeneracy.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **352 tests** ✅ (new `conditionalEffect.test.ts`: then/else, atLeast, enemyCount living-only, nesting, the 4 cards; content.test recurses into then/else)
- `play-verify` PASS, greedy non-degenerate

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / determinism | PASS | byte-identical; pure eval; nested stat-flow; no SAVE_VERSION (correct); content.test recursion. |
| Balance | PASS | whirlwind single-floor works; lucky-dagger good-when-set-up, not dominant; no overshoot. |

### Nits → backlog (accepted, non-blocking)
- whirlwind's `enemyCount==1` evaluates AFTER the AoE resolves, so killing one of two
  enemies lets the floor fire on the survivor (a small "finisher" burst). Arguably fine;
  if undesired, snapshot living-count before the card's effects. Currently untested path.
- `evalCondition` doc overstates a self/player-status branch (code only reads enemies) +
  the whirlwind "inert in multi-enemy" comment is now imprecise — tidy the comments.
- scoreCard's conditional weight over-rates these in greedy (MCTS remains the arbiter).
