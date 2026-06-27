# Increment 48 — Greedy scorer 0-cost fix (tooling, playtest-driven)

**Branch:** `evo/48-scorer-0cost` → base `main` · **Commit:** `2fcd746`
**Pillar:** tooling. First increment of batch 16.

## Why
The batch-15 balance playtest found the #39 greedy `scoreCard` heuristic UNDER-values 0-cost
("free play") cards: `throwing-knife` was 0.00 greedy vs 0.51 MCTS; `venom-dart` 0.07 vs 0.61.
The cost-efficiency used `max(0.7, cost)`, treating a 0-cost card as ~0.7 energy — but a free
play has no opportunity cost, so it's worth strictly more per raw point. Greedy pickRate for
0-cost cards was therefore noise.

## What it does (TOOLING ONLY — no `src/**`)
`costDivisor = card.cost === 0 ? 0.45 : Math.max(0.7, card.cost)` — a free-play premium gated
strictly to cost 0 (1+ cost unchanged). Pure/deterministic.

## Result (greedy@200/300 vs MCTS arbiter)
| card (0-cost) | greedy before → after | MCTS |
| --- | --- | --- |
| throwing-knife | 0.00 → **0.34** | 0.39 |
| venom-dart | 0.07 → **0.54** | 0.51 |
| brace | 0.05 → **0.45** | 0.41 |
Now tracks MCTS, mid-table (not dominant — guillotine etc. still rank above). Non-zero-cost
cards byte-identical (guillotine 0.90→0.90). Greedy 0-cost signal: noise → reliable.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **363 tests** ✅ (free-play premium: 0-cost > old-0.7-result AND > comparable 1-cost; gated to cost===0; deterministic)
- `play-verify` PASS, non-degenerate; `scripts/` only — shipped game + MCTS untouched

## Review — 1 focused lens, 0 blocking
PASS-WITH-NITS: gating correct (0-cost only, 1-cost unchanged + test), 0-cost now tracks MCTS, not dominant, tooling-only. Nit (FIXED): a stale "0.5" doc comment → corrected to 0.45.

### Note
`sidestep` (1-cost, MCTS 0.18 vs greedy 0.00) is a separate scorer limitation — correctly NOT
touched by this 0-cost-gated fix; queue if it matters.
