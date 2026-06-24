# Increment 06 — E1: Meaningful events

**Branch:** `evo/06-events` → base `evo/05-enemy-presentation` (stacked)
**Pillar:** E (engagement) · **Commits:** `0d20434` (impl), review-fix commit follows

## What it does
Events become real decisions: **risk/reward rolls**, **stat checks**, and a
post-choice **result screen** so you see what happened. Two new composite outcome
kinds (resolved by the engine, ≤1 level deep):
- `rollOutcomes { branches, weights? }` — one branch chosen via the `'events'` RNG.
- `conditional { check, atLeast, ifPass, ifFail }` — branches on player state.
Plus option gating: `requires { check, atLeast }` hides an option you can't afford.

A new `state.event.result` sub-phase + `continueEvent` action shows the applied
outcomes before returning to the map (`SAVE_VERSION` 5→6).

### Content
10 events; 4 use risk rolls (vending machine, armory, alchemist, well — some
weighted), 4 use stat gates/conditionals (toll booth, healer, well, cursed idol).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **166 tests** ✅ (determinism, conditional branches, gating, result→continue flow, lethal→defeat, SAVE_VERSION round-trip + v5 quarantine, anti-stall)
- `play-verify` **PASS**, `usedPotion`/`upgradedCard`/**`eventResolved`** all true (autoplayer resolves an event end-to-end without stalling)
- balance non-degenerate; events ≤8% of deaths (arc), 0 in single — neither punishing nor inert

## Review — 4 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / purity / determinism | PASS | Rolls draw only from `'events'` stream + folded back; conditionals consume no RNG (roll order stable); ≤1-level enforced by type + test; every enumerator (legalActions/playtest/bot/autoplayer) handles result→continue (no stall); SAVE_VERSION round-trip verified. |
| Balance / economy | PASS-WITH-NITS | No positive-EV-no-downside gamble; gates priced sensibly; win-rates within ~5pts of baseline. |
| Visual / UX | PASS-WITH-NITS | Option + result + gated views clean, theme-tokenized. |
| Design / depth | PASS-WITH-NITS | Clean Simple-vs-composite model; genuine tension. |

### Findings addressed
1. Fixed the doubled-sign result line (`+ +20 gold` → `+20 gold`; color conveys gain/loss).
2. Gated options now show a dimmed **real number** (aligned column) instead of `[-]`.
3. Added an **anti-stall** content test: every event has ≥1 ungated option.
4. The one free-upside event (`shrine` "Pray") now costs a 20-gold tithe — real tradeoff.

### Deferred → backlog E5
Lean harder on `conditional` build-checks over gold-gates; a `gainPotion` event
outcome (compose with D2); per-event result flavor; an EV-aware playtest policy to
stress-test gambles.
