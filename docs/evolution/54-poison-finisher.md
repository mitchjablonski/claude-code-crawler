# Increment 54 — Detonation Vial (poison finisher) + a key balance insight

**Branch:** `evo/54-poison-finisher` → base `main` · **Commit:** `486370c`
**Pillar:** D (content/variety). Uses the #42 conditional kind.

## What it does (content-only)
**Detonation Vial** — rare, cost 2, attack: `8 dmg + conditional(target poison ≥5 → +18)`
(26 armed); `-plus` 10 + (≥5 → +22) = 32. A poison **FINISHER** (high-threshold, big fixed
burst, adds NO poison) — distinct from #45 Venom Reprisal (atLeast-1 early ramp).

## The insight (why this is content, not a "gap fix")
It was intended to close the single/nightmare Apothecary "+5.7-11.3pp gap". The review's MCTS
arbiter showed that **gap is a GREEDY-POLICY ARTIFACT, not a real imbalance**: under MCTS the
single/nightmare Apothecary cell is already win-saturated (~0.99 = Knight). The greedy bot just
plays poison sub-optimally (needs setup turns it doesn't optimize). So there was no real gap to
close — and the same is likely true of the arc/nightmare "gap" (MCTS wins there too).
**Implication: stop chasing the apothecary nightmare gaps with content — they're a harness/greedy
limitation, not a content problem. The root fix is a smarter greedy poison play-policy (tooling).**

Detonation Vial is shipped anyway because it's a GOOD card on its own merits: MCTS pickRate 0.33
(competitively drafted, not dominant), threshold-5 acts as a de-facto boss/elite gate (poison
reaches ≥5 on ~2% of normal-enemy turns vs ~30% of boss turns → no normal/hard overshoot; greedy
normal/hard apoth actually dipped slightly), no degenerate loop (pure burst, adds/consumes no
poison), fairly calibrated vs guillotine (26-armed/2, gated). It adds a poison-detonate payoff
to the build space.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **380 tests** ✅ (content.test validates the nested card: threshold ≥5, damage payoff, adds-no-poison no-loop)
- `play-verify` PASS, non-degenerate; content-only (`cards.ts` + `content.test.ts`), uses #42 conditional, no engine/SAVE_VERSION

## Review — 1 balance lens, 0 blocking
PASS-WITH-NITS: not a gap-closer (the gap is a greedy artifact), but a well-tuned, non-dominant,
no-overshoot, no-loop finisher — accepted as build-variety/boss-closer content. Threshold 5 is
correct (already a de-facto boss gate). Nit (FIXED): stale ">= 6" comment → ">= 5".

### Queued (the real follow-ups)
- A **smarter greedy poison/combat play-policy** (tooling) so sweeps stop reporting phantom
  apothecary nightmare gaps (the actual root cause).
- Dead-card cluster (MCTS-confirmed real): cleave-the-horde/sidestep/goblin-stomp/heavy-swing/
  shield-wall/second-breakfast/warding-stone/toxic-cloud/iron-stance. → #55.
