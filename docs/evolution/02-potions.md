# Increment 02 — D2: Potions

**Branch:** `evo/02-potions` → base `evo/V1-theme` (stacked)
**Pillar:** D (depth) · **Commits:** `f79fbea` (impl), `992590d` (review fixes)

## What it does
Adds consumable one-shot **potions**: held up to a 3-slot satchel, used in combat,
obtained from the shop and ~25% of combat rewards. Potions compose **only the
existing `Effect` union** (no new mechanics — "content composes, code decides").

### Content (8 potions)
healing-draught (heal 20) · iron-tonic (block 12) · fire-flask (20 dmg) ·
surge-draught (+2 energy) · insight-brew (draw 3) · venom-vial (6 poison) ·
might-elixir (+2 strength) · firebomb-flask (10 dmg all).

### Systems
- `PotionDef` mirrors `CardDef`/`RelicDef`; new `content/potions.ts` table.
- `RunState.potions` + `RunState.maxPotions` (3); `RunConfig.maxPotions`/`startingPotions`.
- Actions `usePotion` (combat-only, modeled on `playCard`) and `buyPotion`.
- Reward: optional potion rolled **last** in the `loot` stream (slot-gated).
- Shop: separate `potionStock` (own price table), rolled after card stock.
- `legalActions` enumerates both new actions, so MCTS plays potions.
- `SAVE_VERSION` 4→5 (old saves quarantined; new runs round-trip).
- UI: combat satchel line, shop potion section, reward "found a potion", StatusBar `pots N/max` — all via theme tokens; unified `theme.POTION_KEYS` (skips `e`).

## Verification (independently re-run on `992590d`)
- typecheck ✅ · lint ✅ · **148 tests** ✅ (7 new potion tests)
- `play-verify` **PASS**, **`usedPotion: true`** (autoplayer now uses a potion end-to-end through the UI), integration moments ✅
- balance (greedy@120): single/knight 68% · arc/knight 81% · single/apothecary 77% · arc/apothecary 82% — non-degenerate

## Review — 4 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / purity / determinism | PASS | No new effect kinds; immutable; validation-before-mutation atomicity confirmed; loot-roll order preserves fixtures; SAVE_VERSION round-trip verified. |
| Balance (MCTS) | PASS | Built a baseline worktree: MCTS win-rate + end-HP **flat with vs. without potions** → potions don't inflate power. Single-act MCTS saturates at 100% even with no potions (pre-existing harness ceiling, not D2). |
| Visual consistency | PASS-WITH-NITS | All potion UI uses theme tokens; no hardcoded colors; fits within contentWidth. |
| Design alignment | PASS-WITH-NITS | Genuine depth (hold/use/shop-vs-save tension); clean pattern adherence; flagged the autoplayer gap. |

### Findings addressed
1. **Verification gap (headline):** autoplayer now uses a potion (and buys one in shops); `play-verify` surfaces + hard-asserts `usedPotion`. The satchel→usePotion keypath is now smoke-tested.
2. Unified `POTION_KEYS` across combat + shop (was divergent); tidied hint text.
3. Snapshots now seed `startingPotions` so the satchel renders in `combat.png`/`shop.png`.

### Deferred (reasonable)
Out-of-combat potion use; discard-when-full (full satchel simply blocks the grant/buy).

## Pre-existing item surfaced
Single-act MCTS saturates at 100% (harness can't discriminate potion power in single mode) — use arc / higher enemy-HP for future potion-balance probes. Logged with the D7 balance-debt note rather than blocking D2.
