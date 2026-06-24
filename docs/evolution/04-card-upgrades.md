# Increment 04 — D1: Card upgrades

**Branch:** `evo/04-card-upgrades` → base `evo/03-card-frames` (stacked)
**Pillar:** D (depth) · **Commits:** `febdbe6` (impl), review-fix commit follows

## What it does
Rest sites now offer **heal OR upgrade a card** — a real tension. Upgrading swaps
a deck card for a stronger `+` variant. 18 upgrades cover all starters + commons +
select uncommon/rare (e.g. Rusty Shortsword 6→9, Shield Wall 12→16 block,
Guillotine 24→32). Upgrades are modeled as separate `-plus` def ids referenced via
a new `CardDef.upgradeTo` (the deck stays `string[]` — no per-instance state, no
`SAVE_VERSION` bump).

### Critical invariant — upgraded variants are NOT draftable
A derived `UPGRADE_TARGET_IDS` set filters `rollCardChoices` (the single pool
backing both rewards and shop). Event grants reference only base ids; the only
path to a `+` card is upgrading. **Verified empirically:** zero `-plus` ids
appeared in `pickRate`/`topCardPlays` across 400 greedy runs/character.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **156 tests** ✅ (8 new: upgradeCard reducer + content integrity)
- `play-verify` **PASS**, `usedPotion: true`, **`upgradedCard: true`** (autoplayer now exercises the upgrade keypath end-to-end)
- balance non-degenerate; **MCTS A/B vs a no-upgrades baseline showed end-HP slightly LOWER with upgrades** → no trivialization

## Review — 4 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / purity / determinism | PASS | `upgradeCard` pure + guarded; draft pool byte-identical per-rarity to baseline (filter doesn't shift roll order); no RNG; no SAVE_VERSION change. |
| Balance / pool exclusion | PASS | Exclusion confirmed clean (no leak in 400 runs/char); upgrades don't inflate power. |
| Visual | PASS-WITH-NITS | Rest menu + upgrade sub-view render as clean CardTile grid; `[+]` affordance via theme token. |
| Design | PASS-WITH-NITS | Genuine heal-vs-upgrade decision, meaningful from turn one; upgrade-as-separate-id is the right model. |

### Findings addressed
1. Removed the redundant "upgraded +" trailing (CardTile's `[+]` already conveys it).
2. Confirmed no stray throwaway scripts left in the tree.
3. Queued backlog **V8** (deck view) — unblocks the rest chooser's 9-card cap + a base→upgraded comparison.

### Deferred (reasonable)
Upgrade chains (`-plus-plus`); a full deck-view (V8); the rest chooser shows the
first 9 upgradeable cards (single-digit hotkeys; `legalActions` exposes all, so
search is unconstrained).
