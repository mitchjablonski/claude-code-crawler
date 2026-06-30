# Increment 71 — UX polish pass (visual/UX pillar opener)

**Branch:** `evo/71-ux-polish` (stacked on `evo/70`) → base `main` · **Commit:** `e9a4047`
**Pillar:** V (visual/UX). The first increment of the visual/UX polish push (per the user's
2026-06-29 direction). Bundles batch-25's five UX-playtest findings — all pure UI + text.

## The 5 fixes
1. **Combat footer ASCII** (CombatScreen): the unplayable-count separator `·` (U+00B7) → `|` —
   restores the codebase's ASCII-safe stance.
2. **`overcharge` gets its own color** (theme): heat-yellow → **red** (= Strength's color). The
   Overclocker HUD had FOUR yellow signals at once (HP tint, HEAT, live gradient, OVC); pulling OVC
   to red de-noises it AND teaches the payout (OVC is the stat that becomes STR). Label/position
   disambiguate it from the HP-critical red — reviewer-confirmed not mush.
3. **Conditional map event tag** (MapScreen): revealed events → ` (event)` (they're decisions);
   hidden gambles → ` (risk/reward)` (accurate — they're the rollOutcomes). A revealed event is
   never mislabeled "risk/reward". MAX_EVENT_NAME sized so neither tag overflows 76 cols.
4. **Overdrive Core names the OVC chip** (cards.ts, text only): "Power: gain 1 Overcharge (OVC).
   Each time you overheat (lose HP), gain Strength equal to your OVC." — connects card → HUD chip →
   Strength. Effects byte-identical.
5. **Event footer** "Continue" → "Continue to map" (matches rest/shop phrasing).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **447 tests** ✅ (footer no-`·`; overcharge color = strength != heat;
  conditional tag incl. "revealed never risk/reward"; overdrive-core desc names OVC; event footer)
  · `play-verify` PASS · pure UI + text (cards.ts: description only), theme tokens only, no
  engine/SAVE_VERSION
- Review — 1 lens, **0 blocking** — PASS (OVC-red verdict: acceptable)

## Polish backlog (noted by review)
- Combat footer worst-case (unplayable + potions + view-deck) is ~83 cols and truncates gracefully
  (`wrap="truncate"`, key hints preserved) — pre-existing (>76 before this). Tighten the footer
  wording so it fits ≤76 even in the worst case — a future polish increment.

## Batch 25 complete
#71 final balance (PR #71) + #72 UX polish (this) — both PRs vs main, reviewed, awaiting merge in
order (#71 → #72). Balancing is locked; the visual/UX polish pillar is now the active focus.

### Polish pillar — candidate next increments
combat/map/reward visual feel + beats; reward/shop/rest screen layout & legibility; color-system
cohesion across screens (the `theme.ts` semantic tokens); the footer-fits-≤76 tightening above.
