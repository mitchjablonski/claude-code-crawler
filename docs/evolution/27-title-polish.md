# Increment 27 — Title onboarding polish (playtest-driven)

**Branch:** `evo/27-title-polish` → base `evo/26-arc-apothecary` (stacked)
**Pillar:** V (UX/onboarding) · **Commit:** `2428e4a`

## Why
Fresh UX playtest, top + #3 findings: (1) cycling `[k] Class:` showed no tagline, so a
new player couldn't tell the classes apart; (2) the footer `announcer: static` leaked a
dev-seam string ("static" is meaningless to a player). Both on the Title screen.

## What it does (pure UI)
- **Class tagline**: the selected character's `description` (e.g. "A stalwart guardian.
  Stacks Block and Strength, then strikes." / "Fragile but venomous — opens with Poison,
  but thin on armor.") renders as a dim sub-line under `[k] Class:`, updating as you
  cycle. App passes `CHARACTERS[character].description`; Title stays presentational.
- **Friendly announcer**: `announcerLabel(backend)` maps `static`→"hand-written", a live
  backend→"live (name)". The bare word "static" no longer appears.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **287 tests** ✅ (tagline renders + swaps with class; announcer friendly label, no bare "static")
- `play-verify` **PASS**; empty `src/engine/` diff (pure UI)
- title.png: tagline dim under the class line; footer `announcer: hand-written`; anchor + all keys + Unlocks line intact, within the chrome

## Review — 1 combined lens (scope+visual+correctness), 0 blocking
PASS. Pure UI (3 files); tagline wired App→Title; announcer never shows "static"; anchors/keys preserved; theme-tokenized; no overflow. (Nit: a test's negative assertion leans on a trailing newline — optional tighten.)

## Batch nine complete
#25 (run-stats foundation), #26 (arc Apothecary balance), #27 (title polish) — PRs #25/#26/#27.
#26 and #27 were driven directly by the fresh Sonnet playtests (balance + UX) run on a
current-code snapshot worktree.
