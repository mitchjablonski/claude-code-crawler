# Increment 77 — Combat juice: beats depth (visual pillar)

**Branch:** `evo/77-combat-juice` → base `main` · **Commit:** `a74d1b5` · **Pillar:** V (visual/UX).
Next-loop increment 1/3. "Combat animations" done the codebase way — deepening the ACTION-DERIVED
beat system, not adding timers.

## Design note (why no timed animation)
`juice.ts` documents that combat feedback is action-derived (prior-vs-current state diff, persists
until the next action) — NOT wall-clock, because the play-verify harness reads static frames and
could never capture/test a fade. So this increment deepens that system; **no `setTimeout`/
`setInterval`/wall-clock** (grep-confirmed by review). Timed animation would require rethinking the
verification model — a separate, larger discussion.

## What it adds (all action-derived, pure, snapshot-tested)
1. **Status-change beats** (the biggest gap): new pure `statusBeats(prior, current)` diffs the
   `statuses` maps and emits `+2VUL` / `-1PSN` / `+1STR` beats in each status's IDENTITY color (same
   theme token as the `[VUL 2]` tags — reviewer-verified: VUL beat = yellow like its tag, PSN =
   magenta). Rendered on both enemy rows (CombatScreen) and the player HUD (StatusBar).
2. **Magnitude emphasis:** hits ≥ `BIG_HIT_THRESHOLD (12)` render `-15!` (danger+bold); chips stay
   plain `-2`. Derived purely from the HP delta.
3. **DoT-tick legibility:** end-of-turn poison already surfaces as a `-N` beat; the new `-1PSN`
   status beat makes the decay read too.

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **472 tests** ✅ (+13: statusBeats gain/decay/no-change/ordering, bigHit
  threshold, enemy +VUL, player +STR, poison tick -N + -1PSN) · `play-verify` PASS · pure UI
  (`src/ui/**`), theme tokens only, no engine/content/SAVE, NO timers
- Review — 1 lens, **0 blocking** — PASS (identity-color consistency + no-timers grep-confirmed;
  budget 9 rows / 75 cols with several beats firing)

## Next loop (stacked, merge in order)
#78 combat juice (this) → #79 new content (cards/relics) → #80 new content (enemies/events).
