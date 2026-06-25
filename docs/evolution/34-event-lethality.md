# Increment 34 — Difficulty-scaled event lethality (playtest-driven)

**Branch:** `evo/34-event-lethality` → base `evo/33-deck-descriptions` (stacked)
**Pillar:** D/E (balance / engagement) · **Commits:** `853ca5c` + `f5b2a9b` (cap fix)

## Why
Event risk branches had no teeth: 0 event deaths in single mode (all difficulties), ~2-3%
at arc/nightmare. `loseHp` amounts were flat across difficulty.

## What it does (engine, deterministic, normal byte-identical)
- New `eventLoseHpMult` difficulty knob: **normal/story 1.0, hard 1.25, nightmare 1.5**.
- Event `loseHp` outcomes are scaled by the knob, then capped at **`max(base, ⌊0.5 · MAX HP⌋)`**.
- #24 event outcome HINTS now show the SCALED loss → informed consent (the player sees the
  worst-case stake before choosing).
- Gains (gold/cards/relics/maxHp) are NOT scaled.

## The cap (review-corrected)
First pass capped at 40% of CURRENT HP — but the review proved that mathematically NEUTERS
lethality (the cap shrinks exactly as the player is wounded, so the multiplier can never land
the killing blow; events died only at `base ≥ hp`, same as normal). Fixed to **50% of MAX HP**
— a stable ceiling that opens a real lethal band (~19-27 HP at nightmare) for a WARNED player,
while the worst single-event loss (base 18 ×1.5 = 27) < full 70 HP → no cheap full-HP one-shot.

## Result (greedy@600) — teeth at nightmare/arc; single AI keeps HP high
| cell | event deaths base→after | winRate |
| --- | --- | --- |
| nightmare/arc | 5 → **10** (~1.7%) | 0.388 → 0.367 |
| hard/arc | 4 → 5 | 0.545 → 0.535 |
| single (all) | 0 → 0 | ~unchanged |
Lethal band UNIT-PROVEN (a wounded 9-HP player dies to a scaled warned event → defeat).
Single-mode event deaths stay ~0 because the greedy AI keeps HP high — the mechanism is real
for a wounded human player + warned by hints; teeth also show as mild win-rate attrition.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **325 tests** ✅ (×1/×1.25/×1.5 scaling; cap clamps; lethal-band defeat; gains not scaled; rng-stream unchanged)
- `play-verify` **PASS**, `eventResolved: true`; normal byte-identical

## Determinism / persistence
normal/story ×1.0 → `loss == base` (base is the cap floor) → normal seeded replay byte-identical;
no rng drawn for scaling (stream unchanged). **SAVE_VERSION 9→10** (RunState gained
`eventLoseHpMult`; v9 quarantines, v10 round-trips; META untouched).

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Balance | PASS (after cap fix) | 40%-current-HP cap neutered lethality → switched to 50%-MAX-HP (decisive reviewer rec); now a real warned-lethal band, no full-HP one-shot. |
| Regression / determinism / persistence | PASS | normal byte-identical + rng-stream unchanged; scaling loseHp-only; SAVE_VERSION 9→10 quarantine + round-trip. |

### Caveat (queued)
The greedy harness's risk-aversion keeps single-mode event deaths at ~0 — the feature is
correct/unit-proven but a large aggregate event-death spike isn't observable with this AI.
A smarter (EV-aware) playtest policy would expose it (queued tooling).
