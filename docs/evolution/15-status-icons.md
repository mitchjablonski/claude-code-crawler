# Increment 15 — V5: Status-effect icons

**Branch:** `evo/15-status-icons` → base `evo/14-intent-variety` (stacked)
**Pillar:** V (visual identity) · **Commit:** `3b3cd2b` + report

## What it does
Establishes ONE consistent status-glyph language across the whole combat UI and
reconciles the inconsistency D6 flagged. Pure UI; no engine change.

- New shared `statusChip(id, stacks, {sign?})` in `theme.ts` is the single source for
  a status glyph: identity color (`theme.status[id].color` — STR always red, VUL
  always yellow…) + canonical `ICON N` format (`+N` for a gained value, e.g. `STR +1`).
- All three render sites now route through it: enemy status tags (`statusSegments`),
  the **new player-status display**, and the D6 intent chips.
- **Player statuses are now visible** — `combat.playerStatuses` already drove damage
  math (vulnerable/strength/poison/regen) but was rendered nowhere; V5 surfaces them
  additively in the StatusBar combat HUD (`[STR 2, VUL 1]`), only in combat when present.
- **D6 reconciliation:** intent-chip statuses moved from threat-axis color (debuff
  magenta) to identity color (VUL yellow), keeping the leading `>>`/`vv` category icon
  + damage/block kind-colors — so a status reads the same everywhere while threat is
  still conveyed by the lead icon.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **215 tests** ✅ (D6 chip fixtures updated to canonical format — pure unification, not weakened; 3 new StatusBar tests; HUD + "coin purse" narration intact)
- `play-verify` **PASS**; all feature flags true; empty `src/engine/` diff (pure UI)
- Visually proven: the same status (VUL) renders identically (yellow, `VUL N`) in the player line, an enemy tag, AND an intent chip; HUD row 75 cols, no overflow

## Review — 3 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / scope | PASS | Pure UI; single-source consolidation verified (no inline status render remains); StatusBar change additive (narration test unchanged); fixture updates are format-unification. |
| Visual | PASS | Same status reads identically across all 3 sites; player statuses legible + additive; no overflow. |
| Design | PASS | Real clarity win (player buffs/debuffs were invisible); identity-color reconciliation is the right call; status language now coherent across V1/V3/V4/V5. |

### Findings addressed
1. Documented `statusChip.icon` as a deliberate art-mirror seam (returned separately from `text` so a future companion app can map it to a sprite).
2. Queued (backlog V10): extract the bracket-wrapping `[ … ]` status-tag markup into one shared component (StatusBar + CombatScreen still duplicate the wrapper; the data is already shared via `statusSegments`).

## Batch five complete
Increments D4 (richer relics), D6 (intent variety), V5 (status icons) — PRs #13/#14/#15.
The combat screen is now both deeper (relic triggers, full move telegraphs) and far
more legible (multi-effect intents, consistent status glyphs, visible player statuses).
