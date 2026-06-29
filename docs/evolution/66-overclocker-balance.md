# Increment 66 — Overclocker balance fixes (playtest-driven)

**Branch:** `evo/66-overclocker-balance` (stacked on `evo/65`) → base `main` · **Commit:** `d2ce8aa`
**Pillar:** B (balance). Second increment of batch 22, from the MCTS-grounded balance playtest.

## Context
The balance playtest found the Overclocker mechanically HEALTHY (MCTS single parity 1.0, no
death-spiral) — only draft-quality bugs remained:

## The 3 fixes (content-only, 5 cards)
| card | old → new | why |
|------|-----------|-----|
| **reckless-swing** (common) | 11 → **14** dmg (+plus 15→18) | MCTS-CONFIRMED dead (0/22 picks — not an artifact); the 2-HP tax didn't justify 11 dmg |
| **overload-blast** (uncommon) | 7 → **9** dmg sc6 (+plus 10→12) | was BYTE-IDENTICAL to common meltdown-strike (an inversion) — now distinct + clearly stronger, still under rare critical-mass |
| **frost-plating** (uncommon) | 8 → **11** block sc6 | was BYTE-IDENTICAL to common coolant-surge — now distinct + stronger, under rare emergency-coolant on total value |

## Validation (own sweeps, reviewer re-confirmed)
- **reckless-swing revived:** greedy 0.26 → **0.68**; MCTS 0/22 → 2/11 (no longer auto-rejected).
- **No inversion:** overload-blast 0.97 ≫ meltdown-strike 0.22; frost-plating 0.93 ≫ coolant-surge
  0.14. The ~0.9 uncommons sit in the natural strong-uncommon band (peers 0.93–0.95), not auto-picks.
- **MCTS single parity = 1.0** holds. **Cross-class safe:** the cards are shared-pool, and the
  reviewer confirmed they're picked ~equally across classes (reckless-swing 0.68/0.71/0.71) with no
  Knight/Apothecary win-rate spike — a class-agnostic flat card, not a synergy warp.

## Determinism / saves
Only the 5 named cards changed (rest byte-identical); `run(seed)===run(seed)` holds; **SAVE_VERSION
unchanged** (cards serialize as ids).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **426 tests** ✅ (no test pinned these stats) · `play-verify` PASS
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS (only nit: frost-plating 11 base block edges a rare's *base* — but the rare leads on total value + cost tier; rarity ordering common<uncommon<rare holds)

## Batch 22 complete
#66 legibility (PR #66) + #67 balance (this, PR pending) — both PRs vs main, awaiting merge in order.

### Carried to batch 23
The 5 universal dead commons (sidestep, tipped-blade, limber, weakening-jab, twin-jab) — a
buff-vs-CULL decision (tipped-blade is an Apothecary starter, so it can't be fully removed). Worth a
focused "dead-card pass 7 / cull" increment rather than another nibble.
