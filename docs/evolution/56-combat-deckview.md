# Increment 56 — In-combat deck view (playtest-driven)

**Branch:** `evo/56-combat-deckview` → base `main` · **Pillar:** V (UX). UX playtest's #2.

## Why
The deck-view overlay (`[v]`) was MAP-only. Mid-combat a player couldn't inspect their deck or
see which cards are where (the HUD shows `draw N disc N hand N` counts, not WHICH cards). Make
the overlay open in combat, read-only, and — since combat pile data exists — show pile membership.

## What it does (pure UI)
- **CombatScreen**: `[v]` opens the read-only deck overlay (App-local `deckOpen` state, mirroring
  the map's view-deck); footer advertises `[v] view deck`. Opening dispatches NO combat action.
- **App**: the overlay gate now allows `combat` phase too (was map-only); CombatScreen gets
  `onViewDeck`. `esc`/`v` closes back to combat.
- **DeckView (combat mode)**: when `state.phase === 'combat'` it reads `combat.hand/drawPile/
  discardPile`, groups rows by pile (hand → draw → disc), tags each row with its pile, and the
  title shows the split `draw N | hand N | disc N`. Draw pile shown UNORDERED (it's shuffled) → no
  next-card-order leak. Map mode (whole-deck grouped) unchanged. Pagination + ≤30-row budget kept.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **382 tests** ✅ (+2: DeckView combat-mode pile summary/tags; CombatScreen `[v]` opens overlay + dispatches nothing = read-only)
- `play-verify` PASS, `viewedDeck: true`; in-combat deck render measured **17 rows / 75 cols** (≤30/≤76)
- Pure UI: App + CombatScreen + DeckView (+ tests); no engine/RunState/SAVE_VERSION change

## Batch eighteen complete
#54 (Detonation Vial poison finisher / PR #55), #55 (dead-card rework ×9 / PR #56), #56
(in-combat deck view / PR pending) — all PRs vs `main`, CI-gated, awaiting human merge.

### Key batch-18 insight (recorded for the loop)
The apothecary single/nightmare & arc/nightmare "gaps" the playtests keep flagging are largely
**greedy-policy artifacts, not real imbalances** (under MCTS those cells win ~1.0 = parity). So
chasing them with apothecary content is misguided; the real lever is a smarter greedy poison/combat
play-policy (tooling). #54's finisher was shipped as build-variety content, not a gap fix. The
dead-card cluster (#55) and these UX items were the REAL, MCTS-confirmed issues.
