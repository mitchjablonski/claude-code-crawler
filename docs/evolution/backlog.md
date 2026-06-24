# Evolution Backlog

The work queue for the autonomous evolution loop. Each item is one increment:
scope → implement in a worktree → play-verify → 4-lens review → address feedback
→ open a change request (never auto-merged) → fast-forward into `evolution`.

Pillars are **interleaved** (chosen 2026-06-23), but **V1 (theme module) lands
first** so later features are built to-spec. Status: `todo` / `doing` / `done` /
`deferred`. "Pillar": V = visual identity, D = depth, E = engagement.

## How the loop picks the next item

1. Highest-priority `todo` whose dependencies are `done`.
2. V1 is the hard first pick (everything visual depends on it).
3. After that, interleave by priority, not by pillar.

---

## Pillar V — Visual identity

| ID  | Item | Priority | Depends | Status |
| --- | ---- | -------- | ------- | ------ |
| V1  | **Central theme module** (`src/ui/theme.ts`): semantic tokens (palette, frame/box styles, status icons, rarity colors, layout widths). Built **art-mirror-ready** — tokens are semantic ("elite", "rare", "poison"), not raw colors — so a future companion app maps the same tokens to real art. Refactor all screens + StatusBar to consume it. `termRender.ts` COLORS derives from it. | P0 | — | **done** (PR #1) |
| V2  | **Consistent screen chrome**: every screen gets a unified header/footer + bordered panels via theme box styles. Kill ad-hoc spacing. | P1 | V1 | todo |
| V3  | **Card frames**: render cards as bordered tiles with cost pip, name, type/rarity color, and description — replace the flat `[1] (1) Strike - ...` lines. | P1 | V1 | **done** (PR #3) |
| V4  | **Enemy presentation**: per-enemy ASCII sigil/banner + HP bar glyphs + clearer intent iconography (attack/block/buff/debuff). | P1 | V1 | **done** (PR #5) |
| V5  | **Status-effect icons**: glyph + color per status (poison, dexterity, block, strength…) used consistently in combat + status bar. | P2 | V1 | todo |
| V6  | **Juice / feedback**: brief visual beats for damage, block, gold gain, card play (within the deterministic engine — presentation only). | P2 | V1, V3 | todo |
| V7  | **Unify item tiles**: generalize `CardTile` into a shared item frame so shop **potions** are framed like cards (V3 left shop potions as plain text). Small follow-up to remove the half-framed shop. | P2 | V3 | todo |
| V8  | **Deck view**: a screen to inspect your full deck outside combat (StatusBar only shows a count today). Unblocks the rest-site upgrade chooser's 9-card cap (add pagination) and a base→upgraded comparison. Surfaced by D1. | P2 | V3 | **done** (PR #9) |
| V9  | **Deck-view follow-ups** (from V8): card detail / effect text on row-select (the compact list omits descriptions); reach the deck view from reward/shop/rest/combat, not map-only. | P3 | V8 | todo |

## Pillar D — Gameplay depth

| ID  | Item | Priority | Depends | Status |
| --- | ---- | -------- | ------- | ------ |
| D1  | **Card upgrades** (rest-site "smith" option + upgraded card variants). | P1 | — | **done** (PR #4) |
| D2  | **Potions**: consumable one-shot items with a slot limit; drops + shop stock. | P1 | — | **done** (PR #2) |
| D3  | **Card rarity + reward weighting**: common/uncommon/rare tiers driving reward + shop pools (flat + depth-scaled). | P1 | — | **done** (PR #8) |
| D4  | **Richer relics**: more triggered/conditional relics (on-combat-start, on-kill, on-shuffle). | P2 | — | todo |
| D5  | **Boss mechanics**: HP-threshold phase changes + signature moves so bosses aren't stat-sticks. | P2 | — | **done** (PR #10) |
| D6  | **Intent variety**: enemies telegraph multi-effect moves (attack+debuff, charge-up) reflected in the intent UI. | P2 | V4 | todo |
| D8  | **Boss/phase follow-ups** (from D5): phase-entry one-time effects (heal-to-block burst, status-on-cross) vs today's pure pool-swap; more phased elites; a first-class `signature` move flag so the UI can emphasize it. | P3 | D5 | todo |
| D7  | **Balance debt: arc mode runs hot.** Rebalance arc-mode difficulty so single/arc win-rates match. Playtest (greedy@300, `normal`) shows arc/knight ~81% and arc/apothecary ~75% vs single ~67-78%, with arc `avgEndHpOnWin` ~47 vs single ~21 — arc is materially easier and players end far healthier. Pre-existing (not caused by V1). Likely lever: per-act enemy-HP/difficulty scaling for arc. | P1 | — | **done** (PR #7) |

## Pillar E — Engagement

| ID  | Item | Priority | Depends | Status |
| --- | ---- | -------- | ------- | ------ |
| E1  | **Meaningful events**: expand events with real risk/reward branches and stat checks (not just pick-an-option). | P1 | — | **done** (PR #6) |
| E2  | **Meta-progression**: cross-run unlocks (cards/relics/classes) persisted via the save store. | P2 | — | todo |
| E3  | **Daily seed**: a shared deterministic seed-of-the-day run with a score summary. | P3 | — | todo |
| E4  | **Deeper Claude-Code moments**: more event→modifier vocabulary (long thinking, big diffs, lint failures) surfaced as flavor + bounded effects. | P2 | — | todo |
| E5  | **Richer event mechanics** (E1 follow-ups): lean harder on `conditional` build-checks (deck/maxHp/relics) over plain gold-gates; add a `gainPotion` event outcome (compose with D2); per-event result flavor text; consider smarter playtest policies (EV-aware for event gambles; rarity-seeking for D3 reward draws) so the harness stress-tests choices the rarity-blind greedy bot ignores. Also track apothecary-arc-normal as the weakest balance seam (~−13pt, pre-existing kit asymmetry). | P2 | E1 | todo |

---

## Deferred epics (not in the current batches)

- **APP-MIRROR — companion app with real art.** A second presentation layer
  that subscribes to the same game state and renders V-pillar *semantic tokens*
  as real raster art, while the terminal stays canonical (ASCII/box art).
  Approved direction 2026-06-23 ("Sounds good"). Sequenced **after** a depth +
  engagement increment or two — the game being deeper matters more than prettier.
  Prereq: V1 must expose semantic tokens (it does, by design).
- **RL self-play** — see `docs/rl-and-search.md`. Out of scope for this loop.
