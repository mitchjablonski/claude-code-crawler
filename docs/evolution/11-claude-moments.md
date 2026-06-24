# Increment 11 — E4: Deeper Claude-Code moments

**Branch:** `evo/11-claude-moments` → base `evo/10-boss-mechanics` (stacked)
**Pillar:** E (engagement) · **Commits:** `e4e2f90` (impl), review-fix commit follows

## What it does
Expands the project's signature hook — real coding activity → game moments — with
new signals detectable from current hook payloads, as flavor + **bounded** effects.
**Entirely in the flavor layer; zero pure-engine change** (reuses existing bounded
`Modifier` kinds → no `SAVE_VERSION`, no determinism risk).

New `GameEventKind`s classified from the Bash command:
- **`lint_failed`** (eslint/biome/ruff/clippy/rubocop/`npm run lint`/…, nonzero exit) → `queueElite` **lint-goblin** (the canonical thematic fit) — distinct snark from tests/build failures.
- **`lint_passed`** (lint command, exit 0) → `lootRoll small` (clean code, small coin).
- **`committed`** (`git commit`) → `healPlayer 5` (a "checkpoint" beat).

Ordering: LINT → `git commit` → TEST → BUILD → `activity`; patterns word-bounded so
lint/test/build/commit never collide (`cargo clippy`≠`cargo build`, `npm run lint`≠
`npm test`, `git push` stays ambient). Indeterminate exit → `activity` (never guesses).

## Safety (bounded; can't be farmed or flood)
- **Failures hard-capped at 2 elites globally** (`MAX_QUEUED_ELITES`) — lint+test+build failures all share it; a 1000-failure storm still queues ≤2, gated to row≥3.
- `committed` heal: +2.5 HP/min sustained (token bucket cap 2, refill 0.5), clamped by `MAX_HEAL`/maxHp — useless at full HP.
- `lint_passed` gold: ~4g/min sustained (tightest bucket, cap 1) — trivial vs combat loot.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **199 tests** ✅ (lint pass/fail/indeterminate; lint↔test/build non-collision both ways; `git commit` vs `git push`; rule mappings; snark tiers; new `lint-and-ship` simulate scenario)
- `play-verify` **PASS**; all feature flags true; engine path unaffected (greedy@200 = 0.68, baseline)
- Confirmed empty `src/engine/` + `saves.ts` diff (pure flavor layer)

## Review — 3 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / scope | PASS | No engine/Modifier/SAVE_VERSION change; classify stays total; ordering verified by replaying the regexes. |
| Balance / safety | PASS | Worst-case quantified; global elite cap + per-effect caps + rate limits make it unfarmable. |
| Design / tone | PASS-WITH-NITS | On-tone, distinct snark; lint→Lint Goblin is the chef's-kiss moment; commit→checkpoint heal is the right metaphor. |

### Findings addressed
1. Fixed a **pre-existing** mismatch: `session_started` narration said "+5 HP" but heals 10 → now "+10 HP".
2. Queued backlog **E6**: `git push` = "ship it" (highest-value easy next signal); a distinct elite for test/build failures so the Lint Goblin is lint's exclusive; `long_thinking`/`big_diff` (need a hook/payload exposing thinking-duration / diff-size).

### Deferred → E6
`git push`, a separate test/build-failure elite, and `long_thinking`/`big_diff`.
