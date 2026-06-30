# Increment 75 — Map / event screen polish (visual pillar)

**Branch:** `evo/75-map-event` (stacked on `evo/74`) → base `main` · **Commit:** `8aafc9a`
**Pillar:** V (visual/UX). Polish-loop increment 3/4. Both screens were already fairly clean → minimal.

## What it does (pure UI — no behavior/info/keybinding change)
- **MapScreen:** the choosable path list gets its own `marginTop={1}` section (matches the economy
  family), so the prompt + cross-act warning read apart from the options; each open `[N]` marker pops
  in accent+bold (same treatment as combat #73) while the path keeps its node-kind color; the
  act-transition warning is bounded to inner width. Named events, the `(event)` vs `(risk/reward)`
  conditional tags, and the hidden `??? Unknown event` mystery nodes are UNTOUCHED (hidden names
  still never leak — reviewer-verified).
- **EventScreen:** open options get the accent+bold `[N]` marker; GATED options mute the whole row
  (marker included) with their inline reason — shop-style, so actionable vs locked reads at a glance.
  Outcome hints, the "You chose:" echo, and the "Continue to map" footer are unchanged.

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **458 tests** ✅ (baseline held — changes are color/bold emphasis +
  blank-line spacing; no exact-frame test breaks, confirmed) · `play-verify` PASS · pure UI, theme
  tokens only (accent/nodeKind/danger/muted), no engine/SAVE
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS. Nits (non-blocking): no FORCE_COLOR test for the
  new markers (coverage gap vs #73's combat-marker test); the section gap is MapScreen-only.

## Polish loop (batch, stacked, merge in order)
#74 hand compaction → #75 economy → #76 map/event (this) → #77 color-cohesion (final).
