# Increment 79 — New content: enemies + events (breadth)

**Branch:** `evo/79-content-enemies` → base `main` · **Commit:** `0280fed` · **Pillar:** content breadth.
Next-loop increment 3/3 (final). New enemies + events on existing systems (no new mechanics).

## What it adds
**4 enemies** (wired into `run.ts` spawn pools by tier/elite):
- **tech-debt-imp** (T1 normal, HP 10-13) — DEBUFFER (Weak/Vulnerable + a pure-debuff telegraph).
- **infinite-loop** (T2 normal, HP 18-24) — RAMPER (+1 Strength/cycle, paced by low base dmg + a block turn).
- **firewall** (T2 normal, HP 24-30) — BLOCKER/turtle (big block + self-Dexterity).
- **null-pointer-swarm** (ELITE, HP 32-38) — SWARM/multi-hit (3×3 chip; no self-applied player
  Vulnerable so it can't snowball). Elite pool now 3 (was 2).

**3 events** (each keeps ≥1 ungated anti-stall option; all ids resolve):
- **haunted-arcade-cabinet** — rollOutcomes GAMBLE, `hiddenOnMap:true` (mystery = the gambles, per #70).
- **unpaid-invoice** — gold-gated decision (revealed).
- **the-rubber-duck** — conditional decision on deck size (revealed).

## Balance / difficulty (reviewer re-run)
Greedy@175 single/arc stays in the established sane band (knight 1.00/0.96, apothecary 1.00/0.94,
overclocker 0.99/0.87); MCTS single spot-check = parity (1.0). Death attribution is still dominated
by the existing boss — the new enemies appear only as isolated deaths in mixed packs; none spikes or
tanks a cell. Enemy stats peer-calibrated (imp≈spore-pod, firewall≈rust-elemental, swarm≈lint-goblin).
Events' greedy-auto-taken options are net-neutral/positive → no class regresses.

## Determinism / saves
Additions only — existing enemies/events BYTE-IDENTICAL; `run(seed)===run(seed)` holds; content
shifts seeded enemy/event rolls (expected). **SAVE_VERSION unchanged (12)** — enemies instantiate
from defs, events serialize as `eventId`; no state-shape change.

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **476 tests** ✅ (+2: enemies well-formed/tiered/in-pool + moves resolve;
  events resolve/ungated/hiddenOnMap curation; quota now ≥3 elites — strengthened) · `play-verify` PASS
- Review — 1 lens, **0 blocking** — PASS (nit: infinite-loop HP a touch above peers but paced — cosmetic)

## Loop COMPLETE
#78 combat juice → #79 content cards/relics → #80 content enemies/events (this). 3 stacked PRs on
top of the merged polish batch, all independently reviewed (0 blocking), merge in order #78→#79→#80.
