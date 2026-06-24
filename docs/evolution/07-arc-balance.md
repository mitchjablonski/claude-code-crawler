# Increment 07 — D7: Arc rebalance

**Branch:** `evo/07-arc-balance` → base `evo/06-events` (stacked)
**Pillar:** D (depth/balance) · **Commits:** `ac982bd` (impl), review-fix commit follows

## What it does
Closes the long-standing **arc-runs-hot** debt and makes the balance harness test
the *real* shipped knobs.

1. **Per-act arc HP ramp.** Arc's flat HP bump left later acts too soft (arc winners
   ended at ~47 HP vs single's ~21). New `actHpRamp` concentrates difficulty in
   acts 1–2: effective mult = `enemyHpMult * (actHpRamp[act] ?? 1)`, applied
   **after** the rng roll. **Act 0's scalar is 1.0** and `DEFAULT_RUN_CONFIG` leaves
   the ramp empty → single mode stays byte-identical (the foundational guarantee).
2. **Difficulty-aware harness.** `scripts/playtest.ts` gained `--difficulty`, now
   builds its RunConfig from `knobsFor(difficulty, mode)` and the engine's after-roll
   path — the old `scaleContent` pre-scaling (which didn't match the engine) is gone.
   Future balance work now tests the live knobs.

## Parity (greedy@300, difficulty-aware harness) — per-difficulty averages within ±2.2 pts
| Difficulty | Knight S/A (Δ) | Apothecary S/A (Δ) | avg Δ |
| --- | --- | --- | --- |
| story | 86/91 (+5) | 93/89 (−4) | +0.5 |
| normal | 62/72 (+10) | 76/66 (−10) | +0.2 |
| hard | 42/50 (+8) | 49/45 (−4) | +2.2 |
| nightmare | 18/27 (+9) | 31/22 (−9) | −0.3 |

All 16 cells non-degenerate (18–93%); no cell >12pt off. Death-by-row confirms the
ramp pushes arc deaths into acts 2–3 as intended.

**Known limitation (accepted):** the residual spread is a *kit asymmetry* — knight arc
slightly easier, apothecary slightly harder, symmetric at every tier. A single shared
arc knob moves both characters together and mathematically can't close an opposite-sign
gap; per-character arc tuning would overfit the greedy proxy (which never plays
potions/upgrades/events where apothecary's kit pays off). Revisit only if MCTS/human
play reproduces it.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **173 tests** ✅ (per-act ramp no-op at act 0, later acts scale after-roll; single byte-identical tests unchanged; v7 round-trip + stale-save quarantine)
- `play-verify` **PASS**; feature flags (`usedPotion`/`upgradedCard`/`eventResolved`) all true

## Review — 3 lenses (no UI change → visual skipped)
| Lens | Verdict | Notes |
| --- | --- | --- |
| Balance | PASS | Full 16-cell matrix; averages within ±2.2; kit asymmetry accepted as a proxy artifact, not overfit. |
| Regression / determinism | **CHANGES-REQUESTED → fixed** | Caught a real blocker (below). |
| Design | PASS-WITH-NITS | Per-act ramp is the right lever; harness-as-source-of-truth is the strongest part. |

### Findings addressed
1. **[blocking, fixed] `SAVE_VERSION` not bumped** despite `RunState` gaining a required `actHpRamp` — a stale v6 save would half-load and crash on first combat (`state.actHpRamp[act]` on `undefined`). Bumped 6→7; added a test that a v6 save quarantines cleanly.
2. **[nit] config comment** noting normal/hard/nightmare intentionally share the ramp shape (per-tier difficulty rides the base mult).

### Deferred (reasonable)
Arc `avgEndHpOnWin` still exceeds single (structural to arc reward/rest density);
per-character arc parity (would overfit the greedy bot). Both queued as known.
