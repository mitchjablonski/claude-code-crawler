# Increment 74 — Economy screens polish (visual pillar)

**Branch:** `evo/74-economy-screens` (stacked on `evo/73`) → base `main` · **Commit:** `bfc483d`
**Pillar:** V (visual/UX). Polish-loop increment 2/4 — reward / shop / rest had no dedicated pass.

## What it does (pure UI — no behavior/info/keybinding change)
- **Reward:** groups the auto-granted loot lines (relic + potion) and adds a `marginTop={1}` gap
  before the "Take a card" prompt — visually separating "what you found" from "what you choose"
  (matching the shop's section spacing). The gap is omitted when there's no loot, so a card-only
  reward has no stray blank row.
- **Rest:** unframed (`framed={false}`) so it reads as one family with reward/shop + its own upgrade
  chooser (it was the only economy screen in a bordered panel); tints the heal amount (success/green)
  and the upgradeable count (accent/cyan) so the actionable values pop — mirroring the shop's gold tint.
- **Shop:** already the legibility reference (uniform sections, inline disabled reasons, dimmed-but-
  readable prices) — left UNTOUCHED to avoid churn.

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **458 tests** ✅ (+4 new RewardScreen tests — none existed; +1 rest
  unframed assertion) · `play-verify` PASS · pure UI, theme tokens only, no engine/SAVE; keys/labels
  byte-identical (reviewer-confirmed)
- Review — 1 lens, **0 blocking** — PASS ("clean polish, no logic/info/keybinding drift; ship it")
- Renders: reward-with-loot 14 rows, reward-no-loot 11 (no stray row), rest 10 (unframed+tinted),
  shop 19 (unchanged) — all ≤76 cols

## Polish loop (batch, stacked, merge in order)
#74 hand compaction → #75 economy screens (this) → #76 map/event → #77 color-cohesion.
