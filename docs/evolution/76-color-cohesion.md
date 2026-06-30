# Increment 76 — Cross-screen color-cohesion audit (visual pillar)

**Branch:** `evo/76-color-cohesion` (stacked on `evo/75`) → base `main` · **Commit:** `378d85a`
**Pillar:** V (visual/UX). Polish-loop increment 4/4 — the capstone.

## Audit result: the palette was already cohesive
Grep across all `src/ui/**`: **zero hardcoded Ink colors / stray hex at call sites** (hex lives only
in `theme.ts`'s palette, correct); every `color=` prop routes through `theme.colors.*` / `hpTint` /
`statusSegments` / token-derived maps. Same-concept colors were already uniform cross-screen (HP=red,
block=cyan, gold=yellow, energy/cost=magenta, success=green, danger=red, muted=grey) and the
deliberate `rarity`/`cardType`/`nodeKind`/`intent` palettes + the recent `heat`=yellow /
`overcharge`=red choices are consistent.

## The one real inconsistency — fixed
The `[N]` selection marker read TWO ways: accent+bold on enemy-target / map-path / event-option
markers (#72/#73/#76), but plain `<Text bold>` on the card/option markers (CardTile [combat hand /
reward / shop-buy], combat hand row, RestScreen upgrade picker, ShopScreen remove). So the same
"press this key" affordance looked different — even within combat (enemy markers popped cyan, hand
markers didn't). **Fix:** routed all four card/option marker sites through `theme.colors.accent`+bold
→ every `[N]` marker is now one consistent treatment app-wide. No token added/renamed (reused the
existing `accent` "markers" token). Color-only.

## Left as-is (deliberately)
The established semantics (overcharge=red, heat=yellow, rarity/cardType/nodeKind/intent palettes);
the footer LETTER-key hints (`[r] rest`, `[u] upgrade`) — a separate idiom from the numbered `[N]`
list selection, so unifying them would be scope creep.

## Note (non-blocking, pre-existing)
The `[N]` marker stays bright on a dimmed unaffordable row (ink/chalk bold-vs-dim limitation) — but
this is pre-existing (the old plain-bold marker was also undimmed) and arguably desirable: an
always-visible press-key matches the enemy/map markers and keeps the card's number readable.

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **459 tests** ✅ (+1: `CardTile.color.test.tsx` FORCE_COLOR test locking the
  unified accent marker — also closes #76's missing-marker-test nit) · `play-verify` PASS · pure UI,
  theme tokens only, no engine/SAVE, no behavior/info/layout change
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS (the bright-marker note above)

## Polish loop COMPLETE
#74 hand compaction → #75 economy → #76 map/event → #77 color-cohesion (this). 4 stacked PRs,
all independently reviewed (0 blocking), merge in order #74→#77.
