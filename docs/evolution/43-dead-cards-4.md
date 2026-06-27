# Increment 43 — Dead-card pass 4 (playtest-driven)

**Branch:** `evo/43-dead-cards-4` → base `main` · **Commit:** `62a6316`

## Why
Fresh playtest: 5 cards confirmed dead (≤0.01 greedy pickRate @300+ offers under the smarter
drafter). Reworked content-only (existing effects; the `conditional` kind isn't in main yet).

| Card | Before | After |
| --- | --- | --- |
| cleave-the-horde | 4 dmg all /1 | **5 dmg all /1** |
| shield-wall | 12 block /2 | **14 block /2** |
| field-rations | 3 heal + 3 block /1 | **4 heal + 5 block /1** |
| limber | 1 dex /1 | **1 dex + 4 block /1** |
| second-breakfast | 4 heal /1 | **3 heal + draw 1 /1** |
(`-plus` of cleave/shield-wall/second-breakfast updated in lockstep; the others have none.)

## Result (MCTS@100 — the arbiter)
All five now sit in a **0.10–0.32 peer band**, none dominant (≤~0.32). limber the standout
lift (0.08→0.31). cleave stays low in single (AoE-in-single, by design) but healthy in arc
(0.18–0.21); it out-picks whirlwind in arc on energy-efficiency but isn't strictly better
(whirlwind = higher raw dmg, uncommon tier). Greedy win-rates non-degenerate (~0.84 single,
new post-#39 baseline).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **341 tests** ✅ (bounds/invariants cover the new values; no fixture needed)
- `play-verify` PASS; single-file diff (`cards.ts`); no engine/SAVE_VERSION change; determinism byte-identical
- **Clean test-merge with #42** (shared `cards.ts`, different cards → no conflict)

## Review — 1 balance lens, 0 blocking
PASS: all lifted into peer band without overshoot; calibration fair vs peers; content-only, `-plus`/`unlock` invariants + determinism intact.

### Note
The playtest's "dead" flag came from the smarter GREEDY drafter (≤0.01); MCTS showed these
nearer 0.08–0.32 (greedy under-values some) — reworked toward the greedy signal while keeping
MCTS non-dominant. battle-trance-for-knight remains weak (queued separately).
