# Increment 26 — Arc Apothecary balance (playtest-driven)

**Branch:** `evo/26-arc-apothecary` → base `evo/25-run-stats` (stacked)
**Pillar:** D (balance) · **Commit:** `0da8ab2`

## Why
Fresh balance playtest: Apothecary trailed Knight badly in ARC (arc/hard −13.4pp,
arc/normal −8.7, arc/nightmare −10.3) while SINGLE was fine. Cause: tipped-blade poison
is single-target-strong but slow in arc's multi-enemy rooms; Knight's block/strength
scales. Mirroring #20 (content-only kit fix), gave Apothecary an **arc-weighted** card.

## What it does (content-only; Knight untouched)
- New `spore-burst` (5 dmg + 1 poison to ALL, /1, starter, kit-exclusive non-draftable;
  +`spore-burst-plus` 7 dmg + 2 poison all). Naturally arc-weighted: scales with pack
  size; in single it's ≈ a shortsword (5 dmg + 1 poison), so it can't balloon single.
- `APOTHECARY_DECK` → 3 shortsword / 3 buckler / 1 tipped-blade / 2 spore-burst.

## Result (greedy@300) — arc gap closed, no single overshoot, Knight unchanged
| mode | diff | Apoth gap (was → now) |
| --- | --- | --- |
| arc | normal | −8.7 → **−4.7** |
| arc | hard | −13.4 → **−9.0** |
| arc | nightmare | −10.3 → **−7.0** |
| single | (all) | stayed ~even (Apoth ≈ Knight; did NOT overshoot) |

Knight byte-identical baseline↔after. No degenerate cell.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **287 tests** ✅ (no fixture changes needed)
- `play-verify` **PASS**; content-only diff (cards.ts + characters.ts); no engine/SAVE_VERSION change

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Balance | PASS | Arc gap meaningfully closed; no single overshoot; new card fair + arc-weighted. |
| Regression / scope | PASS | Content-only; KNIGHT_DECK + Knight cards byte-identical; new cards starter/non-draftable; determinism preserved. |

### Key finding (queued, not a defect)
arc/hard's residual ~−9pp is **content-irreducible without overshooting single** — under
MCTS *both* classes solve arc/hard to 100%, so the gap is a **greedy-bot spread-poison
valuation artifact**, not a real imbalance. The right lever is improving the harness's
greedy poison/AoE valuation (or its blind index-0 reward pick) — queued (overlaps the
playtest's "smarter greedy draft policy" finding) — NOT more AoE content.
