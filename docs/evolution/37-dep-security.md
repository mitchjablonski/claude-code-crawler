# Increment 37 — Dev-dependency security upgrade (pre-merge)

**Branch:** `evo/37-dep-security` → base `evo/36-relics-overflow` (stacked)
**Pillar:** chore / security · **Commit:** `319db36`

## Why
`npm audit` reported **5 vulnerabilities (3 moderate, 1 high, 1 critical)** — ALL in the
dev/test toolchain (not shipped in the built game). Resolved before merging the stack.

## What it does (dev-dependencies only)
| Package | Before | After |
| --- | --- | --- |
| vitest | 2.1.9 | **4.1.9** |
| vite (transitive) | 5.4.21 | **8.1.0** |
| esbuild | 0.21.5 / 0.28.0 | **0.28.1** (via one `overrides` entry) |
| @vitest/mocker | ≤3.0.0-beta.4 | **4.1.9** |
| vite-node | 2.x | removed (vitest 4 dropped it) |
| tsx | 4.22.4 | 4.22.4 (already latest) |

`npm audit` → **0 vulnerabilities**.

The one `overrides` (`esbuild: ^0.28.1`) is justified + safe: tsx@latest still pins the
vulnerable 0.28.0 and no tsx release ships a fixed esbuild yet; 0.28.1 is outside the
vulnerable range (`≤0.24.2 || 0.27.3-0.28.0`), deduped at every node.

## Scope (dev-only, no game change)
Diff = `package.json` + `package-lock.json` + ONE test file. **No `src/**` game/engine/UI
logic changed**, no `SAVE_VERSION`, no global test-config loosening. Engine untouched →
seeded replay/determinism unaffected.

The single test change: `src/search/mcts.test.ts` gained an explicit `30000`ms per-test
timeout (vitest 4 lowered the default to 5s; this CPU-heavy 8-run MCTS-vs-rollout test runs
~4.5s). The run-count / iterations / `mctsWins ≥ greedyWins` assertion are UNCHANGED — not
weakened or skipped.

## Verification (independently re-run)
- `npm audit` → **0 vulnerabilities** ✅
- typecheck ✅ · lint ✅ · **332 tests** ✅ (unchanged count) · `npm run build` (tsc) ✅
- `play-verify` **PASS** (tsx + harness intact); game boots via `tsx src/cli.tsx`; determinism test passes

## Review — 1 focused lens, 0 blocking
PASS: audit clean; dev-only scope (no game logic); MCTS test change is timeout-only; override safe; full pipeline (typecheck/lint/332 tests/build/play-verify) green.
