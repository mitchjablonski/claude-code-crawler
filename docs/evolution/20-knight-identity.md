# Increment 20 — Knight identity / starter rework (playtest-driven)

**Branch:** `evo/20-knight-identity` → base `evo/19-daily-seed` (stacked)
**Pillar:** D (balance) · **Commit:** `3649f06`

## Why
A Sonnet balance playtester (validated on current code) found **Knight ~11–14pp WORSE
than Apothecary in single mode** (normal/hard/nightmare). Root cause: Knight's 5×Rusty-
Shortsword/4×Buckler starter is redundant (dead draws) with no kit identity; Apothecary's
turn-1 poison (Tipped Blade) converts energy better.

## What it does
Gives Knight a **block/strength "guardian" identity** + trims redundancy. Content-only
(composes existing Effect kinds; no engine change):
- New `starter` (kit-exclusive, non-draftable) cards + `-plus` upgrades:
  `oath-keeper` (5 block + draw 1) and `vanguard-stance` (5 block + 1 strength).
- `KNIGHT_DECK` rebuilt: 4×shortsword / 3×buckler / 1×oath-keeper / 1×vanguard-stance.
- Apothecary untouched (the reference).

## Result (greedy@300) — single gap closed to ≤5pp, no overshoot
| mode | diff | Knight | Apoth | gap (was) |
| --- | --- | --- | --- | --- |
| single | normal | 0.717 | 0.770 | −5.3pp (was −11.3) |
| single | hard | 0.473 | 0.480 | −0.7pp (was −11.0) |
| single | nightmare | 0.293 | 0.280 | +1.3pp (was −10.0) |
| arc | normal | 0.673 | 0.580 | +9.3pp |
| arc | hard | 0.513 | 0.417 | +9.6pp |
| arc | nightmare | 0.347 | 0.237 | +11.0pp |

MCTS single/normal: both 1.0 (no class dominance under strong play). Story stays high; no degenerate cell.

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Balance | PASS-WITH-NITS | Single gap closed fairly; new cards fair (block+draw cantrip / combat-scoped strength, not power-creep); arc trade accepted. |
| Regression / scope | PASS | Content-only (cards.ts/characters.ts + 1 test fixture); no engine/Effect/SAVE_VERSION change; starters non-draftable; determinism preserved; quotas hold. |

### Known debt (queued, not fixed here)
Buffing Knight's shared kit to fix single mode widened the pre-existing **arc** Knight-lead
(D7's mode×class asymmetry) from ~4–7pp to ~9–11pp. No mode-agnostic per-class knob avoids
this; re-nerfing the kit would reopen the single gap. Tracked as balance debt — a future
per-mode/per-class difficulty knob or arc-specific tuning. Do NOT re-nerf the Knight kit.
