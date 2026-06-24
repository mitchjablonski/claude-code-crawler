# Increment 17 — V6: Juice / feedback

**Branch:** `evo/17-juice` → base `evo/16-meta-progression` (stacked)
**Pillar:** V (visual / feel) · **Commits:** `5099fff` (impl), review-fix commit follows

## What it does
Combat now SHOWS the result of each action via **action-derived beats** that persist
until the next action — chosen over time-based fades because the terminal + our
frame-based harness can't capture wall-clock animation, and a turn-based board is read
statically between inputs anyway. Pure UI; the deterministic engine is untouched (beats
are read-only derivations over state).

`usePrevOnChange` (`src/ui/juice.ts`) holds the prior state and diffs it; beats:
- enemy **`-N`** damage (danger) + **`DOWN`** on a kill (CombatScreen enemy line)
- player **`+Nblk`** (block), **`+Ng`** (gold), **`+Nhp`** heal / **`-Nhp`** damage-taken (StatusBar)

Each beat reuses the V-pillar semantic token of the thing it annotates (block→cyan,
gold→yellow, heal→green, damage→red).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **245 tests** ✅ (damage beat reflects HP lost + recomputes next action; DOWN on kill; no beat on first render; StatusBar block/gold/hp beats)
- `play-verify` **PASS**; all feature flags true; empty `src/engine/` diff (pure UI)
- Visually confirmed: `-6` red beside enemy HP, `DOWN` on a slain enemy (living enemy untouched), `BLK 10 +5blk`, `78g +28g` — all ≤75 cols, no layout break

## Review — 3 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / correctness | PASS | Edge cases verified leak-free: first render (no beat), combat-end (CombatScreen unmounts → ref resets, HP sync delta=0 → no phantom beat), roster change (unmount + length guard); identity-diff persists-until-next-action. |
| Visual | PASS | Beats legible, color-distinct, no overflow; real responsiveness gain. |
| Design | PASS-WITH-NITS | Action-derived approach is the right pragmatic call; `usePrevOnChange` clean + leak-free; deriving beats in UI keeps the engine pure. |

### Findings addressed
1. **Added the player-took-damage beat** (`-Nhp`, danger) — the review's headline gap: taking a hit on the enemy turn was silent (the single most important beat to feel). Now symmetric to the enemy `-N`.
2. Queued backlog **V11**: an energy-spent (`-Nen`) beat so pure skill/power plays register uniformly; an optional timed flash for live play; a StatusBar overflow guard (6 statuses + beats can theoretically exceed 76 cols).

### Deferred → V11
Energy-spent beat; timed-flash flourish; StatusBar full-row guard.
