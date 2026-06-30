# Increment 72 — Combat legibility polish (visual pillar)

**Branch:** `evo/72-combat-feel` → base `main` · **Commit:** `c558638` · **Pillar:** V (visual/UX).
Second increment of the visual/UX polish push — the most-seen screen.

## What it does (pure UI — CombatScreen only)
1. **Targeting clarity:** in target-select mode, the selectable `[N]` enemy markers now render in
   accent (cyan) + bold (were plain text) — the eye lands on the numbered targets instantly. Only on
   alive enemies; blank padding outside target mode (unchanged).
2. **Enemy-block separation:** a 1-row gap BETWEEN stacked enemies (`marginBottom` on all but the
   last), so each enemy (header + detail) reads as a unit in multi-enemy packs. Single-enemy
   unchanged.
3. **Zone spacing:** already uniform (`marginTop={1}` between enemies/hand/potions) — left as-is.

## Budget — honest framing (corrected by review)
Max pack = 3 enemies. All realistic cases stay well within the 30-row snapshot convention:
1-enemy 19, 3-enemy/4-card 25, target-select 20. The separation adds +2 rows on multi-enemy, which
pushes the **3-enemy + full 5-card hand** case from 29 (main) → **31** rows — i.e. this increment
*introduces* a 1-row cross of the 30-row convention in that case (NOT pre-existing, contrary to the
implementer's note). **Shipped anyway** (review-endorsed): no test enforces ≤30 (it's a snapshot
review convention, not a runtime constraint), real terminals are routinely taller, and the only
offender is the 3-enemy+full-hand state by 1 row. Trimming the separation would sacrifice the real
legibility win for that edge. **#73 (hand compaction) is queued to reclaim the rows** (card tiles are
~37 cols → a 5-card hand wraps to 3 tile-rows; denser tiles / 3-per-row fixes it).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **450 tests** ✅ (+3: targeting markers accent+bold in pending mode;
  between-enemy gap present; no trailing gap after last) · `play-verify` PASS · theme tokens only
  (accent), no engine/content/SAVE
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS (ship-as-is; overflow framing corrected; compaction follow-up)

## Next
#73 hand compaction (denser card tiles so a full hand + a 3-enemy pack fits comfortably) — fixes the
overflow above and is the natural next combat-polish step.
