# Increment 61 — Draft-tension rebalance (playtest-driven)

**Branch:** `evo/61-draft-tension` → base `main` · **Commit:** `0fbbee9` · **Pillar:** B (balance).
Dead-card rework pass 6 + a dominant trim. Content-only (`cards.ts`).

## Why
Batch 20's balance playtest found NO win-rate/class imbalance (single-mode MCTS parity 1.0 both
classes; apothecary "gaps" reconfirmed as greedy artifacts). The real issue was DRAFT TENSION:
auto-pick dominants + persistently-dead cards = trivial/wasted draft choices. Two were structural
bugs: `second-wind` (uncommon) scored BELOW commons; `goblin-stomp` stayed dead through two damage
buffs because the cost-2 common slot is capped below 0-cost commons.

## The 4 changes
| card | old → new | why |
|------|-----------|-----|
| **plague** (rare) | 5 → **4** poison (+ draw 1) | was #1 auto-pick ~2pts above any rare → trivial rare drafts; trim keeps identity |
| **second-wind** (uncommon) | Heal 6 → Heal 6 **+ Block 3** | fix the uncommon-below-common inversion; sustain+defense identity |
| **goblin-stomp** (common) | cost 2 / 11 dmg → **cost 1 / 7 dmg** (2 vuln) | the SLOT was the blocker, not the damage; reslot as a cheap vuln-setter (retires the failed buff-damage approach) |
| **phoenix-feather** (rare) | Heal 12 → Heal 12 **+ 2 Strength** | dead rare; heal alone can't clear the rare bar — sustain+offense rebirth identity |

## Validation (own re-run sweeps, not just scoreCard math)
Greedy@200 pick-rate BEFORE → AFTER — all 4 cross from dead/auto into a contested band, none become a new auto-pick:
- plague 1.00 → **0.95** (off the runaway top) · second-wind 0.00 → **0.27** · goblin-stomp 0.00 → **0.42** · phoenix-feather 0.06 → **0.81**
- Win-rates flat: knight single 0.95→0.955, apoth 0.945→0.935 (noise). Phoenix verified desirable-not-must-pick (peers juggernaut/berserker-brew give more Strength cheaper).

## Determinism / saves
Only these 4 cards edited (others byte-identical); content change shifts seeded runs (expected) but
`run(seed)===run(seed)` holds. **SAVE_VERSION unchanged** (cards serialize as ids).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **382 tests** ✅ (no test pinned these 4 cards' stats — verified) · `play-verify` PASS
- Review — 1 lens, **0 blocking** — PASS (phoenix acceptable; scope/determinism/win-rate sanity confirmed)

## Batch twenty complete
#59 onCombatEnd relics (depth / PR #60), #60 UX legibility pass (PR #61), #61 draft-tension rebalance
(PR pending) — all PRs vs main, CI-gated, awaiting human merge.

### Carried to batch 21
Remaining auto-pick rares (corrosive-mist, viral-load, last-stand, avalanche at ~1.0 — out of #61's
scope) are the next draft-tension lever IF pursued (auto-picking a great rare is arguably fine). The
bigger lever remains a content epic (new class / new act) — a design call for the user.
