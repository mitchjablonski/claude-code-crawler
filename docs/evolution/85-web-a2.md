# Increment 85 — Web Client A2: full run playable in the browser (epic A2)

**Branch:** `evo/85-web-a2` (stacked on `evo/84-web-a1`) → base `main` · **Commit:** `347b9e8`
**Epic:** the Web Client (spec `art_KRfv04wkIA`).

## What it adds — every phase is now a real screen
- **Combat** — enemies with hp bars/block/status tags + full telegraphed intents (shared
  `resolveEnemyMove` + canonical status chips), hand rows with cost/rarity/type/description +
  the live `now N` gradient, unaffordable dimming + `N unplayable`, potions, targeting flow
  (click-or-number → popped `[N]` markers → esc cancels; single enemy auto-targets), `[v]`
  pile-grouped deck overlay, and the **action-derived beats** (`-N!`/`DOWN`/status/hp/gold) imported
  from the SHARED `src/ui/juice.ts` — not a copy. The stage is a swappable seam (`CombatStage`) for
  the phase-C art pass.
- **Reward / Shop / Rest / Event / GameOver** — each mirrors its terminal counterpart's info + keys
  (shop remove service with paging + inline reasons; rest was→now upgrade diff; event stakes hints
  via a verbatim-ported pure hint model; game-over report + `[n]`/`[t]`). Arc act transitions flow
  through the same screens (they're engine-side moves).

## Verification (independently reviewed)
- **Zero-fork: clean** — `src/` diff between A1 and A2 is EMPTY (0 lines). Ported helpers verified
  semantics-faithful: liveGradient == the engine's `missingHpBonus` formula (the #66 check);
  eventHints a verbatim semantic port; juice/beats + `statusChip` + `resolveEnemyMove` all SHARED
  imports via the `.js→.ts` alias.
- **Full-run test verified live ×2** — drives a real seeded run Title→…→run-over purely through the
  DOM (no mocks), asserts combat occurred + the final report, and replays the same seed with an
  identical phase trace + report (determinism).
- lint ✅ · typecheck ✅ · **504 terminal + 73 web tests** ✅ · build + web:build ✅ (273 kB / 77 kB gz)
  · `play-verify` PASS · no rng/clock in web game flow (seed boundary only) · no artifacts committed
- The `App initialState` test seam judged harmless (test-only in effect; seeds a legal RunState;
  all transitions still go through `applyAction`).
- Review — 1 lens, **0 blocking** — PASS.

## Deferred
Game-over personal-best/daily/unlock lines (need phase-B persistence); Dungeon-AI christening +
narration web-side (phase D); real art (the CombatStage seam is ready for phase C).

## Web epic (stacked, merge in order)
A1 scaffold (#85) → **A2 full-run screens (this)** → B shared saves + determinism parity → C art
sub-decision + art pass → D narration + juice parity.
