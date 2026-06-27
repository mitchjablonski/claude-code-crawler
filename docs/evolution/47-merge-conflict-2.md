# Increment 47 — Tame merge-conflict (Rebase strength removed, playtest-driven)

**Branch:** `evo/47-merge-conflict-2` → base `main` · **Commit:** `08792ef`
**Pillar:** D (balance).

## Why
Fresh balance playtest: even after #29, merge-conflict was STILL the #2 arc/nightmare killer
(~21/24 per 300 vs the boss's ~28/37, ~75% as lethal) — its Rebase still granted +1 permanent
strength, so Force Push escalated (12→13→14…) and compounded across acts 2-3 with actHpRamp.

## What it does (content-only)
Removed the `+1 strength` from merge-conflict's Rebase move → it's now a pure `block 6`
breather, so Force Push stays flat (12 phase-1 / 10 phase-2) all fight. Everything else kept
(phases, threshold 30%, Resolve Conflict breather, HP).

## Result (greedy@300, arc/nightmare — deaths mc vs boss)
| class | mc was→now | boss | winRate |
| --- | --- | --- | --- |
| knight | 21 → **16** | 31 | 0.320 → 0.347 |
| apothecary | 24 → **20** | 38 | 0.243 → 0.250 |
Now ≤ boss (~52% of its lethality, was ~75%), still the clear #2 deadliest (not trivialized);
win-rates rose only modestly. Single + arc/normal unaffected (mc already below boss there).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **357 tests** ✅ (content.test enemy/phase validity)
- `play-verify` PASS; single-file diff (`enemies.ts`, only Rebase); no engine/`resolveEnemyMove`/SAVE_VERSION; determinism preserved

## Review — 1 balance/regression lens, 0 blocking
PASS: tamed to ≤ boss without trivializing; surgically scoped (only Rebase strength removed); no over-nerf; determinism intact.

## Batch fifteen complete
#45 (Venom Reprisal poison-payoff / PR #46), #46 (unlock-on-victory / PR #47), #47
(merge-conflict tame / PR #48) — all PRs vs `main`, CI-gated, awaiting human merge. Playtest
notably re-derived #45 independently (it ran pre-#45), validating that fix.
