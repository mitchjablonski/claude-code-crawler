# Increment 01 — V1: Central theme module

**Branch:** `evo/V1-theme` → base `evolution`
**Pillar:** V (visual identity) · **Commits:** `7c3db9c` (impl), `aa1629b` (review fixes)

## What it does
Establishes a single source of visual truth for the terminal UI and routes every
screen through it. Built **art-mirror-ready**: tokens are semantic (`enemyIntent`,
`nodeKind.elite`, `status.poison`), not raw colors, so the deferred companion app
can map the same tokens to real art without a rewrite.

### Token API (`src/ui/theme.ts`)
- `theme.colors` — semantic names → Ink colors: `title, hp, block, energy, gold, enemyIntent, success, danger, muted, accent, cardCost`, plus `nodeKind.*` (per map node kind) and `rarity.*` (reserved for V3 card frames).
- `theme.status` — per `StatusId` → `{ label, icon, color }` (ASCII-safe glyphs: STR/DEX/VUL/WK/REG/PSN).
- `theme.box` — structural seam for V2/V3: `panel`/`emphasis` border styles, `borderColor`, `divider`, `separator`. Defaults only; no screen draws borders yet.
- `theme.layout.contentWidth` — centralizes the width-76 literal.
- `theme.palette` — hex backing each Ink color; `scripts/lib/termRender.ts` derives its canvas `COLORS` from this (no duplicated palette).
- Helper `statusSegments(statuses: Statuses)` → token-styled segments.

### Consumers refactored
All 8 screens + `StatusBar` + `PauseOverlay` now use tokens; zero hardcoded Ink
color names or width literals remain outside `theme.ts` (grep-verified).

## Verification (independently re-run on `aa1629b`)
- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm test` — **141 passed (22 files)**
- `npx tsx scripts/play-verify.ts` — **PASS**; screens: title, map, combat, reward, event, rest, victory; integration: tests-pass gold ✓, Claude-stop return-to-surface ✓

## Review — 4 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / purity / determinism | PASS-WITH-NITS | Presentation-only; no `Math.random`/`Date.now`/logic change; engine purity intact; palette parity confirmed byte-identical. |
| Balance | PASS | No balance-relevant file touched. Win-rates non-degenerate. |
| Visual consistency | PASS-WITH-NITS | Cross-screen consistency holds (HP=red, gold=yellow, intent=danger, etc.); no leftover hardcoded colors. |
| Design alignment | PASS-WITH-NITS | Genuine single source of truth; art-mirror-ready; good scope discipline. |

### Findings addressed (all non-blocking nits)
1. Added `theme.box` token seam so V2/V3 extend a designed slot, not bolt onto a frozen object.
2. `statusSegments()` typed against the engine `Statuses` union (dead fallback removed).
3. Snapshot tooling forces `FORCE_COLOR=3` (colored PNGs) + broader seed sweep (shop screen now captured).
4. Lockstep comment on `termRender.INK_TO_SGR`.
5. `// TODO(card-frames)` on `colors.rarity`.
6. Logged arc-mode balance debt as backlog **D7**.

### Kept by intent
Enemy status labels now render abbreviated (`STR 3` vs `strength 3`) — part of the
status-token design, no logic impact.

## Balance snapshot (greedy@300, normal)
single/knight 67% · arc/knight 81% · single/apothecary 78% · arc/apothecary 75%.
Arc runs hot — pre-existing, tracked as **D7**, not a V1 regression.

## Follow-ups seeded
V2 (chrome) and V3 (card frames) now have the `box` + `rarity` seams to build on.
