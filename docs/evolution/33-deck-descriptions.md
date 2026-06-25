# Increment 33 — Deck-view card descriptions (playtest-driven)

**Branch:** `evo/33-deck-descriptions` → base `evo/32-arc-exhaustion` (stacked)
**Pillar:** V (UX, V9) · **Commit:** `4da72e3`

## Why
UX playtest's #2 ask: the deck-view overlay showed name/cost/type/count but NO card
effects, so a player couldn't plan builds or upgrade/shop choices from it. Add the
effect description so the deck view is a real planning tool.

## What it does (pure UI)
Each deck-view row gains a dim, truncated effect-description line under the existing
`(cost) Name [+]  type  xN` header. Single column, 2 lines/card, **paginated at
PER_PAGE=12** (`[n]/[p]`). Grouped `xN` count + `[esc]/[v]` close preserved.

## Applied #30's row-budget lesson
#30 shipped a layout that overflowed the 30-row budget. Here the budget was the explicit
design constraint: 12 cards × 2 lines + 5 chrome rows = **29 rows ≤ 30**. Verified on a
real 24-card deck render — page 1 = 29 rows, page 2 = 13, footer fully visible. Descriptions
use `wrap="truncate"` so a long effect can never wrap to a 2nd line and silently blow the count.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **312 tests** ✅ (description renders; grouped count; esc+v close; 24-card deck splits pages, each ≤30 rows)
- `play-verify` **PASS**, `viewedDeck: true`; empty `src/engine/` diff (pure UI)
- deck.png: each card shows its dim effect line; large-deck one-off fits with footer visible

## Review — 1 combined lens, 0 blocking
PASS. Pure UI; **measured large-deck full page = 29 rows ≤30, footer visible, truncation-safe** (no #30-style overflow); descriptions render; count/esc/v/pagination preserved; theme tokens only.

## Batch eleven complete
#31 (2nd dead-card pass), #32 (arc exhaustion / boss-climax), #33 (deck descriptions) —
PRs #31/#32/#33. All three driven by the fresh Sonnet playtests.
