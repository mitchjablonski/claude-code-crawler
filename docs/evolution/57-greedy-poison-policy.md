# Increment 57 — Poison-aware greedy combat policy (tooling)

**Branch:** `evo/57-greedy-poison-policy` → base `main` · **Commits:** `0ddc5fe` + `67abcc6`
**Pillar:** tooling. Follow-up to the batch-18 "nightmare gaps are greedy artifacts" insight.

## Why
The greedy harness combat policy was poison-BLIND (fixed type-order, first affordable card), so it
under-played Apothecary's poison ramp — producing phantom "apothecary nightmare gap" balance signals
that MCTS shows aren't real (those cells win ~1.0 = Knight under optimal play).

## What it does (TOOLING ONLY — no `src/**`)
New pure `scripts/lib/combatValue.ts`: a one-ply, state-aware combat-value heuristic. Greedy now
plays the highest value-per-energy card each step (until no positive play → endTurn):
- **poison** valued by cumulative over-fight worth (`f(q)=q(q+1)/2` marginal, capped at HP) → early/stacked poison prioritized;
- **conditional poison-payoff** valued through the REAL predicate (armed only when the target meets the threshold) → Detonation Vial "detonates" at ≥5 poison, not before;
- **damage** via the engine's `attackDamage` (capped at HP) + a flat kill bonus (no overkill inflation);
- **block** valued by telegraphed incoming damage (`resolveEnemyMove`);
- **focus-fire** targeting (lowest-HP living enemy) so poison + payoff + kills concentrate.
Deterministic (seeded tie-breaks), bounded (no tree search). cautious/naive/mcts intent preserved.

## Result + the honest outcome
Greedy got much stronger AND poison-correct (both classes rose; **knight did not regress**):
e.g. single/nightmare apoth 0.53→**0.80**, knight 0.58→0.91; arc/nightmare apoth 0.47→0.53.
BUT the apothecary-vs-knight nightmare gap PERSISTED/widened (~11-16pp) — because one-ply greedy
still under-pilots the poison ramp vs knight's easier-to-pilot block/strength. **MCTS confirms
single/nightmare apoth = knight = 1.0**, so the residual is LOOKAHEAD headroom, NOT content.

**Conclusion (recorded for the loop): a one-ply greedy — even a smart one — cannot eliminate the
class-gap artifact; MCTS stays the arbiter for class balance.** This increment ships as a genuine
proxy-quality improvement (correct poison valuation, more realistic play), not as a gap fix.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **390 tests** ✅ (+ combatValue tests: poison>face, payoff-only-when-armed, lethal/overkill, incoming-aware block, deterministic)
- `play-verify` PASS (one trivial-100% WARNING at single/normal/knight — the smarter greedy makes normal trivial; not an error); `scripts/` only — shipped game + MCTS untouched

## Review — 1 focused lens, 0 blocking — SHIP
PASS-WITH-NITS: strictly better, correct, deterministic proxy; no regression; goal (class-gap) unmet by one-ply design (MCTS arbiter stands); baseline shift + 100%-warning acceptable. Nit: `conditionHolds` duplicates engine `evalCondition` (future-drift risk; acceptable for tooling).

### Note
Batch 19 skipped a fresh greedy playtest: post-#57 greedy still reports the (artifact) class-gap,
and MCTS is the arbiter — so #58/#59 were driven from the established MCTS-validated queue instead.
