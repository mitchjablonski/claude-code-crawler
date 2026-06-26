# Increment 36 — Relics-HUD "+N more" overflow (playtest-driven)

**Branch:** `evo/36-relics-overflow` → base `evo/35-pile-counts` (stacked)
**Pillar:** V (UX) · **Commit:** `8d8dd6b`

## Why
The persistent relics HUD line used `wrap="truncate"`, so at 6+ relics (or long christened
names) it silently clipped at 76 cols with NO indication relics were hidden — the player
couldn't tell they had more of the primary power-build mechanic.

## What it does (pure UI, no new row)
A pure `fitRelics(relics, width)` helper greedily fits names and appends `(+N more)` with the
EXACT hidden count, reserving room for the suffix (incl. 2-digit N) so the whole line never
exceeds the content width. All-fit → no suffix (few-relics unchanged); a lone over-long name
is still shown (existing truncate as last resort); 0 relics → line absent.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **332 tests** ✅ (exact count; full line ≤76 incl. suffix; all-fit→no suffix; lone-overlong shown; 2-digit N)
- `play-verify` **PASS**; empty `src/engine/` diff (pure UI)
- renders: 8 relics → `(+4 more)` (75 cols); 12 relics → `(+8 more)` (75 cols); few-relics unchanged

## Review — 1 combined lens, 0 blocking
PASS. Exact hidden-count; line ≤76 in all cases (suffix-reservation invariant verified); few-relics identical to baseline; pure UI, theme tokens.

## Batch twelve complete
#34 (event lethality), #35 (draw/discard counts), #36 (relics overflow) — PRs #34/#35/#36.
All three driven by the fresh Sonnet playtests; #34's cap was review-corrected (50% max-HP).
