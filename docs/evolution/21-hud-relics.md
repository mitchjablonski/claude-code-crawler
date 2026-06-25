# Increment 21 — HUD: unclip the core premise + persistent relics (playtest-driven)

**Branch:** `evo/21-hud-relics` → base `evo/20-knight-identity` (stacked)
**Pillar:** V (UX) · **Commit:** `13a8a65`

## Why
The Sonnet UX playtester (on current code) flagged the two highest-impact issues:
1. **(near-blocker)** the StatusBar's `dungeon: linked / dormant (ccc init)` text — the
   game's CORE premise (it reacts to your real coding session) — overflowed the 76-col
   frame and was invisible (rendered only as `dunge`).
2. **No persistent relic display** — relics showed once on the reward screen then vanished
   from the UI for the rest of the run, despite being the primary power-build mechanic.

## What it does (pure UI; no engine change)
- **Clip fix**: split narration and the dungeon-link onto their own `contentWidth`-pinned
  rows so neither clips the other; the dungeon-link is now always fully visible, and
  narration gets the full 76 cols (its content stays readable).
- **Persistent relics**: a `relics: <names>` HUD line (christened epithet or base name,
  from App), shown only when relics are held, pinned + `wrap="truncate"` (long lists
  truncate, no overflow), accent-colored.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **265 tests** ✅ (dungeon-link renders in full with a long narration; narration content still shows; relics line shows names + absent when none)
- `play-verify` **PASS**; empty `src/engine/` diff (pure UI)
- combat.png: `relics: Pocket Dice` + `dungeon: dormant (ccc init)` both fully visible; combat measured 29/30 rows, max 75 cols, footer + satchel intact; 10-relic one-off truncates cleanly

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / scope | PASS | Pure UI (3 files); no engine/SAVE_VERSION; separated rows; narration still readable; HUD growth doesn't clip combat. |
| Visual | PASS | Core-premise line now fully visible; relics legible + truncate-safe; combat fits; theme-tokenized, uncluttered. |

This closes the long-deferred V10 status-bar clip (now urgent, since it hid the premise) and the UX playtest's #2.

## Batch seven complete
E3 (daily seed), #20 (Knight rework — balance playtest), #21 (HUD — UX playtest) — PRs #19/#20/#21.
The last two were driven directly by the Sonnet playtesters' validated findings.
