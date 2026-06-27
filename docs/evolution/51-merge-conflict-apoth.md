# Increment 51 — merge-conflict: tame for the block-light Apothecary (playtest-driven)

**Branch:** `evo/51-merge-conflict-apoth` → base `main` · **Commit:** `5125eba`
**Pillar:** D (balance).

## Why
After #29 + #47 cleaned merge-conflict for KNIGHT (~38% of boss lethality at arc/nightmare),
it was still ~76% boss-lethal for the block-light APOTHECARY — its flat Force Push (12) hits
the Apothecary raw (no block buffer). Target: Apothecary mc ≤~50% of boss, no trivialization,
Knight ~unchanged.

## What it does (content-only; the RIGHT lever)
- base-pool **Force Push 12 → 10** (uniform with phase-2) — trims the raw burst.
- **HP `[34,40]` → `[30,35]`** — shorter fight = fewer total Force Pushes (cumulative exposure
  is what kills the block-light class).
Explicitly did NOT raise the enemy's Rebase block (that's backwards — tankier → longer fight →
MORE bursts); a duplicate-Rebase experiment was tried and REJECTED for the same reason.

## Result (greedy@300, arc/nightmare — deaths mc vs boss)
| class | mc/boss before → after | winRate |
| --- | --- | --- |
| apothecary | 76% → **47%** (19/25 → 14/30) | 0.343 → 0.36 |
| knight | 38% → 29% (14/37 → 10/34) | 0.427 → 0.47 |
Apothecary target met; merge-conflict still the #2 killer for both (meaningful, not trivial);
arc/normal + single barely move. Easing of the top tier is modest (~+2–4pp), tier ordering preserved.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **372 tests** ✅ (content.test enemy/phase validity)
- `play-verify` PASS; single-file diff (`enemies.ts`); no engine/`resolveEnemyMove`/SAVE_VERSION; determinism preserved

## Review — 1 balance/regression lens, 0 blocking
PASS-WITH-NITS: Apothecary target met, elite still meaningful, Knight not broken, no over-easing
(tier gradient intact). Force-Push-only is more surgical for Knight but misses the Apothecary
target (61%) — the HP trim carries it across; acceptable.
