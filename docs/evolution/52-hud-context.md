# Increment 52 — In-run HUD context: turn counter + class identity (playtest-driven)

**Branch:** `evo/52-hud-context` → base `main` · **Commit:** `c9ee620`
**Pillar:** V (UX). Two UX-playtest findings.

## What it does (pure UI)
- **Turn counter**: combat pile line now `draw N  disc N  hand N  turn N` (from `combat.turn`),
  combat-only, inline (no new row).
- **Class identity**: a dim `[ClassName]` tag on the StatusBar dungeon-link line (visible every
  in-run screen) + a `Class <name>` field on the GameOver run-report. Fed from
  `CHARACTERS[character].name` via App.

Class tag placed on the full-width dungeon-link line (NOT the space-between resource row, which
clipped `EN 3/3` in the App layout — caught + avoided).

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **376 tests** ✅ (turn matches/absent out of combat; class in+out of combat; GameOver class)
- `play-verify` PASS; `src/ui/` only, no engine/SAVE_VERSION
- combat.png: `... hand 6  turn 1` + `dungeon: dormant (ccc init)  [Knight]`, row 1 intact; worst case (6 statuses + turn 99 + Apothecary + long narration) max 76 cols / 5 rows, EN not clipped

## Review — 1 combined lens, 0 blocking
PASS: pure UI; turn/class correct; no clip; theme tokens. Nits cosmetic (class tag on truncate line — short names only; pre-existing 6-status wrap unchanged).
