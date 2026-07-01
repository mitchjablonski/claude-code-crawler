# Increment 78 — "Finesse & Control" content pack (breadth)

**Branch:** `evo/78-content-cards` → base `main` · **Commit:** `57cd28e` · **Pillar:** content breadth.
Next-loop increment 2/3. New draftable cards + relics on EXISTING primitives (no new mechanics).

## What it adds (8 cards + 8 `-plus` + 3 relics)
Theme: debuff PAYOFFS + dexterity — filling real gaps (Vulnerable had zero payoff cards, Weak had
one, Dexterity was thin).
- **pile-on** (C, 1): 6 dmg, +6 if Vulnerable — the missing Vulnerable payoff.
- **crowd-control** (C, 1): 5 to all, +3 to all if 2+ enemies — crowd-rewarding AoE.
- **quickstep** (C, 0): +1 Dexterity, draw 1 — cheap dex enabler + cycle.
- **hex-bolt** (U, 1): 4 to all + 1 Weak + 1 Vulnerable to all — first dual-debuff AoE setter.
- **pressure-point** (U, 1): 6 dmg, +6 & +2 Weak if Weak — Weak payoff.
- **whirling-guard** (U, 1): +2 Dexterity, 6 Block — dex defensive payoff.
- **finish-the-job** (R, 2): 10 dmg, +12 if Vulnerable (22 armed, < guillotine 24) — Vulnerable finisher.
- **bladestorm** (R, 2): 5×3 — multi-hit Strength payoff (strength applies per hit).
- **Relics:** hex-charm (combatStart: 1 Weak to all), serrated-talon (onKill: +1 Dexterity),
  adrenal-reserve (turnStart + hpBelow 50%: draw 1).

## Balance (reviewer re-run — all contested, parity holds)
Greedy@200 single (k/a/o): every card in a contested band, none dead, none a 1.0 auto-pick. The
greedy-BLIND cards are MCTS-confirmed valued (pile-on greedy ~0.08 → MCTS ~0.35; crowd-control MCTS
0.40 > greedy 0.17 on knight). **finish-the-job** greedy **0.93** @n=600 (within the existing rare
band — frost-plating 0.93, corrosive-mist 0.92 — and UNDER the viral-load 1.0 auto-pick ceiling; not
a new must-pick). bladestorm 0.75 (≈ guillotine 0.79). **Single-mode MCTS parity = 1.0 for all 3
classes** — no win-warp. Relics modest/not dominant (kill-bounded dex, <50%-HP-gated draw, 1
decaying Weak).

## Determinism / saves
Additions only — existing cards/relics BYTE-IDENTICAL; `run(seed)===run(seed)` holds; content shifts
seeded reward/elite rolls (expected). **SAVE_VERSION unchanged (12)** (cards/relics = ids). No
scoreCard change (all effects use already-valued kinds).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **474 tests** ✅ (+2: pack draftable/well-formed/no times+scale/terminal upgrades/relics well-formed) · `play-verify` PASS
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS (only a report-number fix: finish-the-job 0.93 not 0.87 — still under ceiling)

## Next loop
#78 combat juice → #79 content cards/relics (this) → #80 new content (enemies/events).
