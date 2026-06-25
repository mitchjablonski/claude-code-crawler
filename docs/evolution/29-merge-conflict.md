# Increment 29 — Tame the merge-conflict elite (playtest-driven)

**Branch:** `evo/29-merge-conflict` → base `evo/28-best-run` (stacked)
**Pillar:** D (balance) · **Commit:** `9a5fe41`

## Why
Balance playtest: the `merge-conflict` ELITE was over-lethal in arc/nightmare, killing
~2× the final boss (knight 47 vs boss 24). Root cause: its `Rebase` rallies PERMANENT
strength (+2), compounding Force Push across its TWO arc encounters (12→14→16…), plus a
pure-max-damage phase 2 — brutal in acts 2-3 under `actHpRamp`.

## What it does (content-only enemy tuning)
- **Rebase strength +2 → +1** (the primary lever — cuts the compounding-strength root
  cause; that's why it spiked in arc, not single).
- Phase-2 HP threshold ≤0.40 → ≤0.30 (less time in the offense pool).
- Added a "Resolve Conflict" block-6 breather to the phase-2 pool (modeled on the boss's
  enraged-phase pattern — turns the unbroken wall into a readable window).
- Phase-2 Force Push 12 → 10 (base-pool Force Push stays 12 — phase 1 still threatening).

## Result (greedy@300, arc/nightmare — deaths: merge-conflict vs boss)
| class | merge-conflict was→now | boss | winRate was→now |
| --- | --- | --- | --- |
| knight | 47 → **30** | 24 | 0.343 → 0.377 |
| apothecary | 40 → **25** | 28/30 | 0.273 → 0.343 |

No longer out-kills the boss (at/below it), still the #1–#2 killer (not trivialized);
winRate rose only modestly. Single + arc/normal not neutered (merge-conflict already
below the boss there; still a real enemy). No degenerate cell.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **297 tests** ✅ (enemy/phase validity holds; no fixture changes)
- `play-verify` **PASS**; single-file diff (`enemies.ts`); no engine/`resolveEnemyMove`/SAVE_VERSION change; determinism preserved

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Balance | PASS | Tough-but-fair (≤ boss, not trivialized); winRate impact modest; Rebase-strength root-cause lever sound; both classes hit appropriately. |
| Regression / scope | PASS | Content-only (only merge-conflict changed); new move valid (existing `block`); base Force Push 12 / phase-2 10 / Rebase +1; determinism preserved. |
