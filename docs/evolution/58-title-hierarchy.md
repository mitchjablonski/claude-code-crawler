# Increment 58 — Title class-first hierarchy (playtest-driven)

**Branch:** `evo/58-title-hierarchy` → base `main` · **Pillar:** V (UX). UX playtest's recurring #5.

## Why
The title was a flat vertical list, so the character-defining class choice read as just another
config row (next to mode/difficulty/snark). A new player couldn't tell "who you are" from "how
you play."

## What it does (pure UI)
Groups the menu into sections with dim `— heading —` separators + a margin between each:
- **Start**: `[c] Continue` (if save) / `[n] New delve` / `[t] Daily`
- **— Your hero —**: `[k] Class: <name>` (name now in accent) + the dim tagline
- **— Run setup —**: `[m] Mode` / `[d] Difficulty` / `[s] Snark`
- `[q] Quit`
All keys, the `Unlocks: N/M` line, and the `announcer:` footer preserved.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **382 tests** ✅ (App title test extended: asserts the "Your hero" + "Run setup" headings; class/tagline cycling still asserted)
- title.png: clean Start / Your hero / Run setup / Quit sections, class name in accent, within the chrome
- Pure UI: `Title.tsx` (+ App.test assertion); no engine/SAVE_VERSION change

## Review
Pure cosmetic reshuffle; all keys/labels preserved; verified by eye + the extended title test.

## Batch nineteen
#57 (poison-aware greedy combat policy, tooling / PR #58), #58 (title hierarchy / PR pending).
Wrapped at TWO increments — the headline tooling fix + a clean UX win — rather than force a
filler third: the clear, high-value, MCTS-validated queue has thinned after 19 batches. No fresh
playtest this batch (post-#57 greedy still reports the class-gap artifact; MCTS is the arbiter).

### Recommended next directions (the queue is maturing)
- A **content epic** (a new class or a new act) — the largest remaining lever for "fuller/more
  engaging"; long-deferred.
- The **map event-naming design call** (user decision: name events on the map — engine change +
  determinism shift + mystery tradeoff — vs a generic caution tier).
- Smaller queued: onCombatEnd relics (D9), event-result recall elevation, map fork differentiation.
