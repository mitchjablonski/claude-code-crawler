# Increment 41 — Event-result screen aftermath flavor (playtest-driven)

**Branch:** `evo/41-event-result` → base `main` · **Commit:** `6fbecd6`

## Why
UX playtest: the event RESULT screen was a sparse "transaction receipt" — outcome lines +
Continue, lots of empty space, no narrative close.

## What it does (presentation/content; no save change)
Adds a dim italic **aftermath flavor line** to the result view that closes the loop:
- per-event authored `aftermath: { win, loss }` (new optional `NarrativeEventDef` field, authored for all 10 events, DCC-tone)
- deterministic **valence-based fallback bank** for events without one.
Valence is a pure fold over the resolved `applied` outcomes (gold/HP net; maxHp ×5;
card/relic grant +100 so "took the relic, bled a little" reads as a win) — no rng, so the
same resolution always renders the same line. Resolution logic untouched.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **336 tests** ✅ (per-event win/loss; grant-as-win valence; deterministic fallback render-stability)
- `play-verify` **PASS**, `eventResolved: true`; **no `SAVE_VERSION` change** (static content); `run.ts`/`saves.ts` byte-identical (presentation-only)
- result one-offs: shrine (good) → win line; cursed-idol (bad) → loss line; both ≤76 cols, dim italic, anchors + Continue preserved

## Review — 1 lens, 0 blocking
PASS: presentation-only, deterministic valence (+ test), correct win/loss, theme-tokenized, #24 option hints untouched. Nit: fallback-bank variety is low (harmless/intentional).

### Deferred → backlog
Chosen-option "You chose: X" recall — the chosen option isn't in EventState; adding it needs
a RunState field + SAVE_VERSION bump, not worth it for a dim line this increment.

## Batch thirteen complete
#39 (draft policy / PR #40), #40 (card pass / PR #41), #41 (event-result / PR #42) — all PRs
against `main` (the new post-merge workflow), CI-gated, awaiting human merge.
