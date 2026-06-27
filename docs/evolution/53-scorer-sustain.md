# Increment 53 — Greedy scorer regen/sustain fix (tooling, playtest-driven)

**Branch:** `evo/53-scorer-sustain` → base `main` · **Commit:** `11d0518`
**Pillar:** tooling. Follow-up to #48 (the next scorer blind spot).

## Why
The batch-16 balance playtest found the greedy `scoreCard` heuristic UNDER-values regen/sustain
(it scored regen like a one-shot point, but regen heals N HP every turn for the rest of the
fight): iron-hide (regen 3 /1) was 0.04 greedy vs ~0.46 MCTS; troll-blood (regen 4 /2) 0.00 vs ~0.42.

## What it does (TOOLING ONLY — no `src/**`)
`STATUS_VALUE.regen` 1.4 → **2.1** (regen-gated; all other weights unchanged). Calibrated to 2.1
(not the suggested 2.5-3.0) so iron-hide lands just under its MCTS ceiling rather than overshooting.

## Result (greedy@200 vs MCTS arbiter)
| card | greedy before → after | MCTS |
| --- | --- | --- |
| iron-hide | 0.02 → **0.43** | ~0.39-0.46 |
| troll-blood | 0.00 → **0.28** | ~0.25-0.43 |
Now track MCTS, not dominant. Non-regen controls unchanged (guillotine 0.90→0.90, throwing-knife ~0.33). Confirmed on both classes.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **376 tests** ✅ (regen scores above old 1.4-weight; regen-gated — non-regen card unchanged; deterministic)
- `play-verify` PASS, non-degenerate; `scripts/` only — shipped game + MCTS untouched

## Review — 1 focused lens, 0 blocking
PASS: tooling-only, regen-gated, in-band tracking MCTS, not dominant, 2.1 well-calibrated, deterministic.

## Batch seventeen complete
#51 (merge-conflict apothecary fix / PR #52), #52 (in-run HUD turn+class / PR #53), #53 (scorer
regen fix / PR #54) — all PRs vs `main`, CI-gated, awaiting human merge.

### Queued (batch 18)
- **Map event-node naming**: surfacing the event name needs `eventId` assigned at map-GENERATION
  (events are currently rolled at node ENTRY) → an engine change that shifts determinism for
  existing seeds + a SAVE_VERSION bump + removes the "Unknown" mystery — a DESIGN CALL for the user,
  not a unilateral UX tweak. (Or a generic caution-tier signal instead.)
- dead-card rework (sidestep/goblin-stomp/second-breakfast/iron-stance); arc ramp/exhaustion nudge;
  map fork differentiation (enemy count); + the in-flight batch-17 balance playtest's findings.
