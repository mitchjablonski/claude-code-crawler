# Increment 14 — D6: Intent variety

**Branch:** `evo/14-intent-variety` → base `evo/13-richer-relics` (stacked)
**Pillar:** D (depth / combat clarity) · **Commit:** `3fb1211`

## What it does
The enemy intent telegraph previously showed only the move name + total damage and
one category icon — hiding the *secondary* effects of multi-effect moves. D6 renders
the FULL upcoming move as compact, theme-tokenized **chips**, so the player can make
informed block/defend decisions. Pure UI; no engine/content change.

`intentChips(content, enemy)` (via the phase-aware `resolveEnemyMove`) maps each
effect of the resolved move:
- damage → `Ndmg` / `NxTdmg` (danger color)
- block → `+Nblk` (block color)
- `applyStatus` **self** → enemy self-buff chip `STR+1` (buff color)
- `applyStatus` **on player** → debuff chip `VUL2` (debuff color) — the key new info
- heal → `+Nhp`

Renders `next: >> Style Violation  9dmg  VUL2` — one line, ≤76 cols even for the
boss's worst move (`STR+1 4x3dmg`, ~60 cols).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **212 tests** ✅ (4 new: multi-effect shows damage + debuff; multi-hit `4x2dmg`; pure block; self-buff chip)
- `play-verify` **PASS**; all feature flags true; empty `src/engine/` diff (pure UI)
- Visually confirmed: plain attack (`>> Swarm 2x2dmg`), multi-effect (`9dmg VUL2`), boss buff+hit (`STR+1 4x3dmg`), and a 3-enemy mix (attack/defend/buff) — color-distinct, aligned, no overflow

## Review — 3 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / correctness | PASS | **Self-buff vs player-debuff mapping verified correct** (the main bug risk); pure UI; phase-aware via `resolveEnemyMove`; `next:` anchor preserved. |
| Visual | PASS | Readable, color-distinct chips, no overflow/clip, multi-enemy aligned; genuine improvement over damage-only. |
| Design | PASS | Genuine decision-clarity win (now you can see an attack also applies Vulnerable); chip model clean; pure-UI + charge-up-deferred is the right scope (content already has heavy multi-effect coverage). |

### Findings — deferred (nits)
1. **Chip vs player-status color/format mismatch** (handed to **V5**): chips color by *threat axis* (debuff=magenta, buff=green); the player status line colors by *status identity* (VUL=yellow, STR=red) and formats `VUL 2` vs the chip's `VUL2`. V5 (status-effect icons) is the right owner to establish the shared status-chip language and decide the coloring rule. Carried into the V5 brief.
2. Charge-up look-ahead (telegraph the NEXT-turn move) deferred — needs a next-cycle look-ahead the engine doesn't expose; queued.

### Deferred → V5 / backlog
Chip/status color+format reconciliation (V5); charge-up look-ahead.
