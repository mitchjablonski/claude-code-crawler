# Increment 55 — Dead-card rework pass 5 (playtest-driven)

**Branch:** `evo/55-dead-cards-5` → base `main` · **Commit:** `4f2e2c2`
**Pillar:** D (balance / build variety). The REAL (MCTS-confirmed) content problem from the batch-18 playtest.

## Why
A cluster of 9 cards was MCTS-dead (≤~0.10-0.20), diluting reward choices — a genuine content
problem (unlike the apothecary nightmare "gaps", which are greedy artifacts per #54).

## What it does (content-only)
| Card | Before → After |
| --- | --- |
| goblin-stomp | 8 dmg+2vuln/2 → **11 dmg+2vuln/2** |
| cleave-the-horde | 5 dmg all/1 → **6 dmg + 1 vuln all /1** |
| second-breakfast | heal 3+draw/1 → **heal 5+draw/1** |
| shield-wall | 14 blk/2 → **10 blk/1** |
| heavy-swing | 14 dmg/2 → **14 dmg+1 Str/2** |
| sidestep | 4 blk+draw/1 → **5 blk+draw/1** |
| warding-stone | 8 blk/1 → **6 blk+1 Dex/1** |
| toxic-cloud | 2 poison all/1 → **4 poison all/1** |
| iron-stance (rare) | 3 Dex/2 → **3 Dex+6 blk/2** |
(`-plus` variants updated in lockstep.)

## Result (MCTS — the arbiter; greedy over-values AoE so MCTS was used for those)
All 9 lifted into a **~0.10-0.45 peer band, none dominant**. The AoE-overshoot risk was checked:
toxic-cloud greedy 0.72 → **MCTS 0.45/0.33** (NOT dominant — greedy inflated it); cleave greedy
0.52 → **MCTS 0.08/0.15** (lifted off dead, lower end). Others 0.10-0.36 MCTS. Greedy win-rates
non-degenerate (~0.94 single, no balloon).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **380 tests** ✅ (content.test bounds/quotas/`-plus`/upgrade invariants)
- `play-verify` PASS; single-file diff (`cards.ts`); no engine/SAVE_VERSION; AoE-poison rares untouched; determinism preserved
- **Clean test-merge with #54** (both touch cards.ts, different cards)

## Review — 1 balance lens, 0 blocking
PASS: AoE reworks did NOT overshoot under MCTS (the key risk — greedy inflation collapsed to fair peer-band); all 9 in-band, none dominant; content-only, invariants intact.

### Note
goblin-stomp/second-breakfast/sidestep still read 0.00 under GREEDY (its draft-scorer undervalues
draw/heal/setter riders) but MCTS confirms them healthy (0.17-0.28) — a known greedy-scorer limit,
not a card problem.
