# Increment 12 — V2: Consistent screen chrome

**Branch:** `evo/12-screen-chrome` → base `evo/11-claude-moments` (stacked)
**Pillar:** V (visual identity) · **Commits:** `4b76d3e` (impl) + report

## What it does
A shared `Screen` chrome primitive gives every screen one identical frame —
**header** (title + optional right-aligned `meta`), a divider rule, the body, and a
**footer** key-hint line — killing the per-screen ad-hoc spacing/title/footer
duplication. Pure UI; no engine change; theme tokens only.

- `src/ui/components/Screen.tsx` — props `{ title, meta?, footer?, framed?, children }`, dumb/presentational.
- New `theme.chrome` token set (paddingX, gap, title/footer color, border) sitting alongside `theme.box`/`theme.layout`.
- **Two cohesive variants:** calm screens (title, map, rest-menu, event, game-over) get a full bordered panel; the tight COMBAT + wide grid screens (reward, shop, deck, rest-upgrade) use the *same* header/divider/footer treatment without a full box, so combat (StatusBar + enemies + framed hand + satchel + footer) still fits the 30-row/76-col budget with no clipping.
- All 8 screens + DeckView + PauseOverlay refactored through it; StatusBar HUD aligned to `contentWidth`.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **202 tests** ✅ (3 new Screen tests; one StatusBar test fixed by pinning only the HUD row — no assertion weakened, App.test unchanged)
- `play-verify` **PASS**; autoplayer detects every screen; all feature flags true
- Confirmed empty `src/engine/`+`saves.ts` diff (pure UI); all 13 harness anchors preserved
- Eyeballed title/map/combat/reward/shop/rest/event/deck/victory/defeat/pause: consistent header+divider+footer everywhere, framed panels close cleanly on 4 sides, nothing overflows 76 cols or clips vertically

## Review — 3 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Visual | PASS | Strong cohesion; framed-vs-lighter split principled, not jarring; no clipping. |
| Regression / scope | PASS | Pure UI; anchors + input handlers byte-identical; StatusBar fix sound. |
| Design | PASS-WITH-NITS | `Screen` is a clean, genuinely-reused abstraction; framed/lighter split is a defensible row-budget call. |

### Findings — deferred (cosmetic, real regression risk at batch tail → backlog V10)
1. `contentWidth - 2` inner-width math leaks into EventScreen/PauseOverlay — folding it into `Screen` risks destabilizing the tuned combat/grid column widths, so deferred.
2. StatusBar's secondary "dungeon: linked" row clips the snapshot right edge — pinning it would truncate the narration content a test asserts; needs a row-separation fix. Deferred. (Only visible in the fixed-width snapshot canvas; a real terminal is wider.)

Both queued as **V10**. The PauseOverlay off-by-2 the design reviewer flagged is a non-issue — it renders `framed={false}`.

## Batch four complete
Increments D5 (boss mechanics), E4 (Claude-Code moments), V2 (screen chrome) — PRs #10/#11/#12.
