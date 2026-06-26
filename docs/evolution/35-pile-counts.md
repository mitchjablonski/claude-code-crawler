# Increment 35 — Combat draw/discard pile counts (playtest-driven)

**Branch:** `evo/35-pile-counts` → base `evo/34-event-lethality` (stacked)
**Pillar:** V (UX) · **Commit:** `12b71d4`

## Why
UX playtest's #1 ask: mid-combat the HUD showed HP/BLK/EN + hand but NOT the draw/discard
pile sizes — the core tempo clock of a deckbuilder (knowing when a reshuffle is coming).
The data existed on `CombatState` but was never rendered.

## What it does (pure UI)
A combat-only HUD line `draw N  disc N  hand N` (from `combat.drawPile/discardPile/hand`
lengths), on its OWN line below HP/BLK/EN. The combat `deck N` (redundant — split across the
three piles) is replaced by this breakdown; `deck N` still shows OUT of combat.

## Width discipline
On its own line → cannot overflow regardless of status count. Worst case (6 statuses + 99 block
+ 99999g + 4 relics + long narration) measured max 74 cols; full combat frame 30 rows ≤ budget.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **328 tests** ✅ (counts match pile lengths; absent out of combat; `deck N` out-of-combat only; worst-case ≤76)
- `play-verify` **PASS**; empty `src/engine/` diff (pure UI)
- combat.png: `draw 3  disc 0  hand 6`, no combat `deck N`, relics + dungeon-link intact

## Review — 1 combined lens, 0 blocking
PASS. Pure UI; counts match; combat-only; theme tokens; worst case 74 cols / 30 rows (no overflow). No #30-style row regression.

### Note
Full combat frame is now at 30 rows (the budget ceiling) — future combat-HUD additions should
reduce/replace rather than add a line.
