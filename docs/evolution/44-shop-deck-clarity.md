# Increment 44 — Shop affordability + deck-view upgrade markers (playtest-driven)

**Branch:** `evo/44-shop-deck-clarity` → base `main` · **Commit:** `a616b09`
**Pillar:** V (UX). UX playtest's #2 + #3.

## What it does (pure UI)
- **Shop**: unaffordable items (price > gold; also sold / no potion slot) render DIMMED while
  the gold PRICE stays readable — actionable picks pop. Decision via one exported
  `isBuyable(item, gold, slotFree)` helper; buy logic untouched (display only). (Cards already
  dimmed; the gap was potion prices dimming too — fixed.)
- **Deck view**: a cyan `^` marker on upgradeable cards, computed with the SAME rule as the
  rest site (`upgradeTo` resolves) → the marker set matches the rest-site "(N upgradeable)"
  count; already-upgraded `-plus` cards correctly unmarked. Inline (no extra rows; #33
  description/`xN`/pagination untouched).

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **346 tests** ✅ (5 new: isBuyable affordable/unaffordable/exact/sold/no-slot; price-readable; marker matches rest-rule + count)
- `play-verify` PASS; **`src/ui/` only**, no engine/SAVE_VERSION
- low-gold shop render: 20g/15g items pop, 75g/90g + 60g potion dimmed with prices bright; deck render: `^` on upgradeable, `[+]`-only on `-plus`; ≤76 cols, no clipping

## Review — 1 combined lens, 0 blocking
PASS: pure UI; affordability correct + price readable; marker consistent with rest site; theme tokens; tests sound.

## Batch fourteen complete
#42 (conditional-effect engine / PR #43), #43 (dead-card pass 4 / PR #44), #44 (shop+deck clarity / PR #45) — all PRs vs `main`, CI-gated, awaiting human merge. All driven by the fresh Sonnet playtests (which independently endorsed the conditional engine as #1).
