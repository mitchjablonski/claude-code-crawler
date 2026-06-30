# Increment 70 — Final balance pass (closes out balancing)

**Branch:** `evo/70-final-balance` → base `main` · **Commit:** `e5f620c` · **Pillar:** B (balance).
The last balance increment before the project pivots to visual/UX polish. From batch 25's
MCTS-grounded 3-class playtest, which found **all classes at single-mode MCTS parity 1.0** (no
death-spirals, nothing broken) — only three small real items remained.

## The 3 changes (content only)
| change | old → new | why |
|--------|-----------|-----|
| **twin-jab** | `5×2` flat → **Weak-payoff conditional** (Weak → `7×2`=14, else `5×2`=10) | the one #68 buffed common MCTS didn't rescue (~0.07); now a payoff for weakening-jab's Weak |
| **second-breakfast** | rarity common → **starter** (shelved) | best-sampled dead card (0.00 greedy / 0.10–0.14 MCTS over 21 offers); save-safe shelve (CardDef kept) |
| **Overclocker maxHp** | 60 → **63** | light arc-attrition QoL buffer (arc nightmare greedy 0.35→0.38) — honest caveat below |

## Validation (own sweeps + reviewer re-run)
- **twin-jab:** greedy 0 → ~0.55 (lifted, not auto-pick <0.7); MCTS out of the dead zone (knight 0.25, overclocker 0.09; apothecary unmoved — poison class doesn't want Weak, by design). Weak synergy confirmed (14 vs 10).
- **second-breakfast:** confirmed OUT of the draft pool (rarity starter), CardDef kept, in no starter deck.
- **Overclocker maxHp 63:** single-mode MCTS parity **1.0 HOLDS** (buffer didn't break single); knight/apothecary unaffected (they take maxHp from the difficulty knob).

### Honest caveat on the Overclocker nudge
Arc is MCTS-unverifiable (arc MCTS times out) AND greedy under-pilots a glass cannon, so the "lossy"
arc-greedy figure understates skilled play; single is already at MCTS parity. This is a small QoL
buffer, not a power fix — deliberately modest (+3 HP, arc winrate +0.03).

## Determinism / saves
Only twin-jab, second-breakfast, overclocker maxHp touched; other content byte-identical;
`run(seed)===run(seed)` holds. **SAVE_VERSION unchanged (12)** (cards=ids, maxHp is content,
character=id).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **442 tests** ✅ (twin-jab 14-vs-Weak/10-cold; second-breakfast out-of-pool; overclocker maxHp 63; guard: no times+scaleMissingHp) · `play-verify` PASS
- Review — 1 lens, **0 blocking** — PASS

## Balancing is locked — next: visual/UX polish
Three consecutive playtests confirm a mechanically mature, balanced 3-class game. Per the user's
direction (2026-06-29), the next push is the **VISUAL / UX POLISH pillar (V)**. Opening polish batch
(#71+) bundles batch-25's UX-playtest findings: combat-footer ASCII fix (`·`→`|`); give `overcharge`
its own color (de-yellow the HUD); `(event)` vs `(risk/reward)` map tags; name the `OVC` chip in
Overdrive Core's text; "Continue → Continue to map".
