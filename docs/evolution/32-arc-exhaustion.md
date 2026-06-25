# Increment 32 — Arc per-act exhaustion (boss-climax / endHp scaling, playtest-driven)

**Branch:** `evo/32-arc-exhaustion` → base `evo/31-dead-cards-2` (stacked)
**Pillar:** D (balance / depth) · **Commit:** `cef6faa`

## Why
Two playtests' #1 balance priority: arc winners reached the final boss at ~39-46 HP vs
single's ~13-22, muting the boss's 50%-HP phase climax. Target arc `avgEndHpOnWin` ~28-35.

## What it does (engine, deterministic, arc-only)
`applyActTransitionExhaustion` charges a fixed **−10 MAX HP** when advancing into a deeper
act in ARC mode (−20 over a 3-act run; current HP clamped down; both clamp ≥1, never
lethal), wired into `chooseNode` (`src/engine/run.ts`). A MapScreen warning (UI, value
derived from the engine constant) telegraphs it; the HUD `-Nhp` beat + dropped max bar show it.

**Max HP, not current HP**: a current-HP toll gets rested back toward max before the boss,
so it wouldn't move boss-arrival HP — only a permanent max cap makes the wear stick
(confirmed empirically: endHp moved ~12 HP).

## Result (greedy@300) — endHp goal met, single byte-identical
| arc cell | endHp was→now | winRate was→now |
| --- | --- | --- |
| normal/knight | 46.6 → **33.3** | 0.78 → 0.68 |
| hard/knight | 45.5 → **33.3** | 0.64 → 0.55 |
| nightmare/knight | 45.6 → **34.8** | 0.44 → 0.36 |
| normal/apoth | 46.1 → **33.6** | 0.73 → 0.67 |
| hard/apoth | 40.5 → **30.3** | 0.59 → 0.50 |
| nightmare/apoth | 44.5 → **33.9** | 0.36 → 0.30 |

All arc endHp now in the 28-35 band. **Single mode byte-identical** (one act → toll never
fires; proven via gate + determinism test + matrix). No degenerate cell.

## Tuning decision (reviewer): KEEP −10
−7/−8 were tested — only −10 holds endHp ≤35 across all arc cells (the primary goal); −7/−8
miss the band and make arc EASIER than single at hard/nightmare. The apparent parity
inversion is only at NORMAL; at hard/nightmare arc stays within ±3-6pp of single (knight
cells even arc-easier). The worst cell (arc/normal/apoth) traces to a PRE-EXISTING
single/normal/apoth ease anomaly (0.803), not this toll.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **309 tests** ✅ (toll on crossing; no toll intra-act/single; clamp ≥1 non-lethal; determinism; MapScreen warning present/absent)
- `play-verify` **PASS**; SAVE_VERSION unchanged (9; maxHp already existed); determinism preserved

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Balance | PASS-WITH-NITS | endHp goal met; −10 is the right value; max-HP lever sound; parity tightened at hard/nightmare. |
| Regression / determinism | PASS | Single byte-identical (proven 3 ways); fire-once-forward-only; ≥1 clamp; no SAVE_VERSION; UI constant derived (no drift). |

### Nits → backlog
- Investigate the pre-existing single/normal/apothecary ease (0.803, easiest cell) separately — NOT an exhaustion issue.
- Add a test walking TWO act boundaries to lock the cumulative −20 stacking (one crossing is tested; cumulative verified empirically).
