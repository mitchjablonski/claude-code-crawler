# Increment 46 — Unlock notifications on the GameOver screen (playtest-driven)

**Branch:** `evo/46-unlock-on-victory` → base `main` · **Commit:** `fc5c8ca`
**Pillar:** E/UX. UX playtest's #2.

## Why
Cross-run unlocks (E2) were announced only on the NEXT Title screen — a player who wins and
immediately starts a new run MISSED the fanfare. The peak moment is the victory screen.

## What it does (pure UI)
App computes `unlockedNames` from its existing run-end `justUnlocked` diff (same id→name
resolution as the Title) and passes it to GameOverScreen, which renders a bold success-green
`NEW UNLOCKED: <names>` line under NEW BEST/score (only when there are unlocks;
`wrap="truncate-end"` for long lists). Title highlight + `justUnlocked` lifecycle unchanged.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **360 tests** ✅ (line shown w/ names; omitted when empty/absent)
- `play-verify` PASS; `src/ui/` only, no engine/SAVE_VERSION
- victory.png: `NEW UNLOCKED: Crawler's Resolve, Heroic Second Wind` under `NEW BEST! 1036`; defeat shows no line

## Review — 1 combined lens, 0 blocking
PASS: pure UI; same unlock set/resolution as Title; lifecycle intact (no double-fire); renders + truncates within chrome; theme tokens. Nit: id→name resolver duplicated across Title/App (could be a shared helper — non-blocking).
