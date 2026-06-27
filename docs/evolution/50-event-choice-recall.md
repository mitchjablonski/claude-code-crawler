# Increment 50 — Event result "you chose X" recall (playtest-driven)

**Branch:** `evo/50-event-choice-recall` → base `main` · **Commit:** `1ac0074`
**Pillar:** UX. The standing #1 UX ask across several playtests.

## Why
The event RESULT screen showed outcomes + aftermath but not WHICH option the player chose —
acute "what just happened?" after a dice (`rolled`) outcome.

## What it does (pure UI — no save bump)
EventScreen records the chosen option in a component `useRef` at press time and renders a dim
`You chose: <label>` line atop the result view. Reset on Continue; guarded by `eventId` match
(no stale label across events); resume edge (ref null) renders nothing, never crashes.
Deliberately UI-only — no RunState/SAVE_VERSION change (also avoids colliding with #49's v11).

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **363 tests** ✅ (shows label; no line when unknown/resume-edge; no stale leak across events)
- `play-verify` PASS, `eventResolved: true`; `EventScreen.tsx`-only diff (no engine/RunState/SAVE_VERSION)
- deterministic + rolled result one-offs: `You chose: <label>` above the header, theme-consistent, within chrome

## Review — 1 combined lens, 0 blocking
PASS: pure UI; label correct; reset/stale-guard + resume-edge handled; hints/aftermath/option-view untouched; theme tokens.

## Batch sixteen complete
#48 (greedy 0-cost scorer fix / PR #49), #49 (shop card removal / PR #50), #50 (event choice
recall / PR #51) — all PRs vs `main`, CI-gated, awaiting human merge. Led by the user-requested
0-cost fix; #49/#50 from the fresh playtests.
