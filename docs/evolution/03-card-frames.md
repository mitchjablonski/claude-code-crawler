# Increment 03 — V3: Card frames

**Branch:** `evo/03-card-frames` → base `evo/02-potions` (stacked)
**Pillar:** V (visual identity) · **Commits:** `7f44cf9` (impl), review-fix commit follows

## What it does
Replaces the flat `[1] (1) Strike - Deal 6 damage.` lines with bordered **card
tiles**. A new shared `CardTile` component renders one card identically across the
combat hand, reward choices, and shop card stock — a 2-column wrapping grid of
round-bordered tiles showing a numbered selection marker, a cost pip, the name
colored by rarity, a type tag (attack/skill/power), and the wrapped description.
Pure presentation — zero engine/logic/balance change.

### CardTile API (`src/ui/components/CardTile.tsx`)
`{ marker, card, dim?, trailing? }` — caller owns the marker, affordability, and
keypress handling; the tile is dumb. Fixed width (`CARD_TILE_WIDTH = 36`); two per
row = 73 ≤ `theme.layout.contentWidth` (76), so rows wrap with no overflow.

### Theme payoff (vindicates V1)
Consumes V1's `theme.box.panel`/`borderColor`, `theme.colors.rarity`,
`theme.colors.cardCost`, `theme.layout.contentWidth`, and adds a new semantic
`theme.colors.cardType` token (attack=red, skill=cyan, power=magenta). The
previously-reserved `rarity` token is now live. Zero colors outside `theme.ts`.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **148 tests** ✅ (no test changes needed — substring
  assertions on card names still hold; harness anchors preserved)
- `play-verify` **PASS**, **`usedPotion: true`**, autoplayer walks full runs
  (number-key card selection + the `Your hand:`/`Satchel:`/`Victory!`/… anchors
  survived the reframe)
- balance unmoved (greedy ~69/82/78/80%) — presentation change, as expected

## Review — 4 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Visual quality | PASS-WITH-NITS | Tiles align in a clean grid; no overflow; cards identical across all 3 surfaces; shop's framed-cards + plain-potions reads as a coherent hierarchy. |
| Design alignment | PASS | CardTile is a genuinely dumb, reused component; theme usage exemplary; scope clean (UI-only). |
| Regression / balance | PASS | Diff is UI-only (5 files); no engine/content/search/persistence; balance unmoved. |

### Findings addressed
1. `CardTile` now imports `ReactNode` from `react` instead of relying on the global `React` namespace.
2. Snapshot canvas height (`termRender.ROWS`) raised 22→30 so framed screens (taller hand) aren't clipped — the combat footer now renders in snapshots.
3. Queued **V7** (unify shop potions into a shared item tile) so the shop isn't half-framed long-term.

### Known limitation (tooling, not the game)
In the PNG mirror, box-drawing borders look slightly dashed — a `frameToCanvas`
fidelity artifact (15px glyph in a 9px cell), affecting all bordered panels
equally; a real terminal draws connected `round` borders. Tracked as a future
snapshot-renderer polish, not a V3 defect.
