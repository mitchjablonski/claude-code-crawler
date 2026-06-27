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
| V2  | **Consistent screen chrome**: every screen gets a unified header/footer + bordered panels via theme box styles. Kill ad-hoc spacing. | P1 | V1 | **done** (PR #12) |
| V3  | **Card frames**: render cards as bordered tiles with cost pip, name, type/rarity color, and description — replace the flat `[1] (1) Strike - ...` lines. | P1 | V1 | **done** (PR #3) |
| V4  | **Enemy presentation**: per-enemy ASCII sigil/banner + HP bar glyphs + clearer intent iconography (attack/block/buff/debuff). | P1 | V1 | **done** (PR #5) |
| V5  | **Status-effect icons**: glyph + color per status (poison, dexterity, block, strength…) used consistently in combat + status bar. | P2 | V1 | **done** (PR #15) — shared `statusChip`, player statuses surfaced, D6 colors reconciled |
| V6  | **Juice / feedback**: brief visual beats for damage, block, gold gain, card play (within the deterministic engine — presentation only). | P2 | V1, V3 | **done** (PR #17) — action-derived beats: -N/DOWN/+blk/+g/±hp |
| V11 | **Juice follow-ups** (from V6): an energy-spent (`-Nen`) beat so pure skill/power card-plays register uniformly; an optional brief timed flash layered on top for live play; a StatusBar overflow guard (6 statuses + beats can theoretically exceed 76 cols — truncate/drop beats first). | P3 | V6 | todo |
| V7  | **Unify item tiles**: generalize `CardTile` into a shared item frame so shop **potions** are framed like cards (V3 left shop potions as plain text). Small follow-up to remove the half-framed shop. | P2 | V3 | todo |
| V8  | **Deck view**: a screen to inspect your full deck outside combat (StatusBar only shows a count today). Unblocks the rest-site upgrade chooser's 9-card cap (add pagination) and a base→upgraded comparison. Surfaced by D1. | P2 | V3 | **done** (PR #9) |
| V9  | **Deck-view follow-ups** (from V8): card detail / effect text on row-select (the compact list omits descriptions); reach the deck view from reward/shop/rest/combat, not map-only. | P3 | V8 | todo |
| V10 | **Chrome polish** (from V2): fold the `contentWidth - 2` inner-width math into the `Screen` primitive so screens stop hand-deriving it; give the StatusBar's secondary "dungeon: linked" row width-discipline so it doesn't clip the snapshot right edge (tension: pinning it truncates the narration content a test asserts — resolve by separating the rows). Also (from V5) extract the bracket-wrapping status-tag markup (`[ ... ]`) into one shared component so StatusBar + CombatScreen don't duplicate it (data is already shared via `statusSegments`). | P3 | V2 | todo |

## Pillar D — Gameplay depth

| ID  | Item | Priority | Depends | Status |
| --- | ---- | -------- | ------- | ------ |
| D1  | **Card upgrades** (rest-site "smith" option + upgraded card variants). | P1 | — | **done** (PR #4) |
| D2  | **Potions**: consumable one-shot items with a slot limit; drops + shop stock. | P1 | — | **done** (PR #2) |
| D3  | **Card rarity + reward weighting**: common/uncommon/rare tiers driving reward + shop pools (flat + depth-scaled). | P1 | — | **done** (PR #8) |
| D4  | **Richer relics**: more triggered/conditional relics (on-combat-start, on-kill, on-shuffle). | P2 | — | **done** (PR #13) — onKill/onCardPlayed + hpBelow |
| D9  | **Relic follow-ups** (from D4): `onCombatEnd` (post-fight heal/gold — needs run-level effect application) and `onShuffle` triggers; richer conditions (status-present, enemy-count, energy-spent) only when a relic concept demands one. | P3 | D4 | todo |
| D5  | **Boss mechanics**: HP-threshold phase changes + signature moves so bosses aren't stat-sticks. | P2 | — | **done** (PR #10) |
| D6  | **Intent variety**: enemies telegraph multi-effect moves (attack+debuff, charge-up) reflected in the intent UI. | P2 | V4 | **done** (PR #14) — multi-effect chips; charge-up look-ahead deferred |
| D8  | **Boss/phase follow-ups** (from D5): phase-entry one-time effects (heal-to-block burst, status-on-cross) vs today's pure pool-swap; more phased elites; a first-class `signature` move flag so the UI can emphasize it. | P3 | D5 | todo |
| D7  | **Balance debt: arc mode runs hot.** Rebalance arc-mode difficulty so single/arc win-rates match. Playtest (greedy@300, `normal`) shows arc/knight ~81% and arc/apothecary ~75% vs single ~67-78%, with arc `avgEndHpOnWin` ~47 vs single ~21 — arc is materially easier and players end far healthier. Pre-existing (not caused by V1). Likely lever: per-act enemy-HP/difficulty scaling for arc. | P1 | — | **done** (PR #7) |

## Pillar E — Engagement

| ID  | Item | Priority | Depends | Status |
| --- | ---- | -------- | ------- | ------ |
| E1  | **Meaningful events**: expand events with real risk/reward branches and stat checks (not just pick-an-option). | P1 | — | **done** (PR #6) |
| E2  | **Meta-progression**: cross-run unlocks (cards/relics/classes) persisted via the save store. | P2 | — | **done** (PR #16) — milestone-derived unlocks of 8 extra cards/relics; classes left always-available |
| E7  | **Meta-progression follow-ups** (from E2): smooth the front-loadable milestone curve (a single Hard-arc win crosses 3 milestones at once — add a variety milestone, e.g. win with both classes); richer Title UX showing WHICH milestone unlocks WHAT + a locked-teaser list; (framework already supports class-gating if a new unlockable class is ever authored). | P3 | E2 | todo |
| E3  | **Daily seed**: a shared deterministic seed-of-the-day run with a score summary. | P3 | — | **done** (PR #19) |
| E4  | **Deeper Claude-Code moments**: more event→modifier vocabulary (long thinking, big diffs, lint failures) surfaced as flavor + bounded effects. | P2 | — | **done** (PR #11) — lint pass/fail + git commit |
| E6  | **More Claude-Code signals** (E4 follow-ups): ~~`git push` = "ship it"~~ **done (PR #18)**; a distinct elite for test/build failures so the Lint Goblin is lint's exclusive payoff; `long_thinking`/`big_diff` once a hook/payload exposes thinking-duration / diff-size; give `pushed` a mechanically-distinct effect from `agent_spawned` (both are `blessNextCombat strength 1` today — narration differs but mechanics coincide). | P3 | E4 | partial (push done) |
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

## Playtest findings (2026-06-24, Sonnet balance playtester on current code)

Validated against current code. Driving batch seven + queued:
- **Knight/Apothecary ~11-14pp gap** (single, normal/hard/nightmare): Knight's 5×Rusty-Shortsword/4×Buckler starter is redundant + lacks a kit identity; Apothecary's Tipped Blade (turn-1 poison) converts energy better. → batch seven (Knight rework).
- **Dead cards** never picked by MCTS: `battle-trance` (dominated by adrenaline-rush), `avalanche`, `corrosive-mist`, `juggernaut`; `troll-blood` (regen 5) over-dominant rare. → batch seven (card balance pass).
- **Arc endHp structural gap**: arc winners reach the boss ~22-28 HP healthier than single, softening the 50% boss phase climax. → queued: arc boss-climax scaling (D7 follow-up).
- **Events rarely lethal at hard/nightmare** (0-1 event deaths / 300): scale risk-branch `loseHp` + stat-gates by difficulty. → queued (E-pillar).
- Boss is 95%+ of single-mode deaths (route is resource-management, not survival) — inherent, watch.

## Daily-seed follow-ups (from E3)
- "Already played today" state (daily is currently re-rollable for a better score); streak counter; copy-seed share; persist the daily tag through save/resume (SAVE_VERSION bump); daily-specific GameOver flavor.

## NOTE on the UX playtest
A second Sonnet "UX" playtester ran against a worktree cut from `main` (737a1c1, pre-evolution baseline), so its findings describe the 19-increments-ago game and are mostly stale (it flagged player-statuses/deck-view/card-frames/rest-upgrade as "missing" — all shipped in batches 1-6). Re-run a UX playtester on the CURRENT branch (without worktree isolation, which based off main) for valid UX feedback.

## UX playtest findings (2026-06-24, Sonnet UX playtester on CURRENT code — valid)

Ranked by player impact. #1/#2 → batch seven #21 (HUD); rest queued:
- **(near-blocker) StatusBar right-edge clip**: the `dungeon: linked / dormant (ccc init)` row — the GAME'S CORE PREMISE (it reacts to your coding) — overflows the 76-col frame and is invisible (shows only `dunge`). Row 2 isn't pinned to contentWidth like row 1. → #21.
- **No persistent relic display during a run**: relics show once on the reward screen then vanish from the UI everywhere. The primary power-build mechanic is invisible between rewards. → #21.
- **Thin post-run stats**: GameOver shows only seed/deck-size/gold; wants depth, relics, turns, damage. (GameOverScreen already gets full RunState.) → queued.
- **Events don't preview outcome ranges**: options say "(risky)" with no HP/gold range → no agency. → queued (E-pillar; pairs with E5).
- **Map is a flat list, not a tree**: no spatial structure / route planning; `RunMap` has row/lane/next to render spatially. → queued (V-pillar).
- DeckView shows no card descriptions (→ V9); rest upgrade shows no before→after (→ V9); no class description on title; `announcer: static` dev-seam label leaks to players.
- Confirmed delight: combat juice, multi-effect telegraphs, status icons, enemy sigils/names, snark, unlock counter, daily, pause overlay, card-tile consistency.

## Batch-seven balance debt (queued)
- **Arc Knight-lead widened** by #20 (Knight kit buff): arc knight now ~+9-11pp over apoth (was +4-7). Needs a per-mode/per-class knob or arc tuning; do NOT re-nerf the Knight kit (reopens single gap).
- **Dead-card balance pass** (from the balance playtest, deferred from batch seven): rework `battle-trance` (dominated by adrenaline-rush), `avalanche`, `corrosive-mist`, `juggernaut` (MCTS never picks); temper `troll-blood` (regen 5) rare dominance.

## Fresh playtest findings (2026-06-25, Sonnet balance + UX on the current-code snapshot — valid)

Re-validated batch 7/8: #20 single-gap CONFIRMED closed (no overshoot); #21/#23/#24 UX fixes CONFIRMED land; #22 mostly landed (corrosive-mist/juggernaut/battle-trance now drafted; avalanche mode-conditional; troll-blood tempered, mode-specific). Driving batch nine + queued:

### Balance
- **(top) Arc Apothecary gap**: arc/hard Knight 0.587 vs Apothecary 0.453 (+13.4pp, WIDER than #20's accepted ~9.6); arc/normal +8.7, arc/nightmare +10.3. Apothecary's tipped-blade poison is single-strong but slow in multi-enemy arc rooms; Knight's block/strength scales. Lever: content-only Apothecary arc-relevant starter card (preferred) OR a per-class arc knob. → batch nine #26.
- **merge-conflict elite over-lethal in arc/nightmare**: kills 47 vs the boss's 24 (its ≤40% phase = pure 12-dmg Force Push spam, brutal in acts 2-3 w/ actHpRamp). Lever: raise phase threshold 40%→30% or re-add a Rebase at low frequency. → queued.
- **events non-lethal at hard/nightmare**: scale risk-branch loseHp by difficulty (hard×1.25, nightmare×1.5). → queued (overlaps E5).
- **harness greedy reward policy = always index 0** → greedy pickRate is NOISE (measures offer order, not desirability). Add a heuristic card-scorer to the greedy draft policy so sweeps give real signal without full MCTS. → queued (tooling; overlaps E5).
- regen creep (iron-hide/troll-blood/second-wind) is mode-asymmetric (weak single, strong arc) — by design, watch. Character-gating a card subset would raise expressed build variety (note).

### UX
- **(top) class taglines on title**: `Character.description` exists but is never shown — cycling to Apothecary tells a new player nothing. ~3 LOC in Title.tsx. → batch nine #27.
- **`announcer: static` dev-seam** label leaks to players → rename to a player-facing/world label. → batch nine #27.
- deck-view card descriptions (V9); rest before→after upgrade preview (V9); event-result flavor callback (overlaps E5); map spatial/tree view; "Unknown event" node `?` sigil; weighted-roll odds in event hints.

## Batch-ten fresh playtest findings (2026-06-25, balance + UX on current-code snapshot)

Re-validated: #20/#22/#26 held (single parity stable; batch-seven dead cards all drafted by MCTS); #25 GameOver stats + #27 class taglines/announcer confirmed land. Balance #1 finding = merge-conflict over-lethality (ALREADY FIXED in #29, validated independently). Addressed this batch: #28 best-run, #29 merge-conflict, #30 rest before→after upgrade. Queued for batch eleven+:

### Balance (from fresh balance playtest)
- **New dead cards (MCTS <15% picked, both classes)**: `viral-load` (poison6-all/2 — worst in pool), `berserker-brew` (2str, lose 4hp /1 — HP loss anti-synergistic), `torch-jab` (5dmg+2burn/1), `lucky-dagger` (conditional ×2 rarely fires). A second dead-card pass (content-only, like #22). → batch eleven.
- **Arc boss-climax / endHp structural gap** (D7 follow-up): arc winners reach the boss at ~43-46 HP vs single ~13-22, muting the 50% boss climax. Lever: small per-act HP "exhaustion" cost OR per-mode arc boss-HP mult; target arc endHp ~28-35. → queued.
- **Event lethality at HARD** (not nightmare — nightmare events DO kill ~3.5%): events' `loseHp` is flat across difficulty; scale hard×1.25 (cap ~1.5×). Pairs with E5. → queued.
- Arc cross-class gap at normal/hard = HARNESS ARTIFACT (MCTS 99-100% both classes); only nightmare may have a small real component. Don't chase with content.
- **Greedy reward policy is blind (index-0)** → greedy pickRate is noise, uncorrelated with MCTS. Add a heuristic card-scorer so sweeps give real per-card signal cheaply. → queued (tooling; the right lever for the #26 arc/hard residual too).
- troll-blood mode/class-asymmetric (dead single, top arc/apoth) — by design, watch; lint-goblin 3rd killer in arc/nightmare — monitor if elite HP scaling changes.

### UX (from fresh UX playtest)
- **Deck-view card descriptions** (V9) — #2 UX ask; deck view shows no effects → can't plan/compare. → batch eleven.
- Map "Unknown event" risk signal (no stakes hint at the node); relics HUD overflow at high counts (silent truncate → show "+N more"/count); event-result screen sparse (flavor callback); draw/discard pile counts in combat HUD.

## Batch-eleven fresh playtest deltas (2026-06-25)
- #29 merge-conflict CONFIRMED tamed (arc/nightmare knight 30 vs boss 24, apoth 25 vs boss 30 — no longer 2×). #20/#22/#26 hold.
- **Dead-card correction**: fresh MCTS shows only viral-load + lucky-dagger were truly dead (berserker-brew 0.50 / torch-jab 0.46 were greedy false-positives). #31 reworked all four harmlessly (no overshoot) but lucky-dagger still weakest (0.13) — needs a stronger lever later. whirlwind/twin-jab/pommel-strike newly surfaced as MCTS-weak.
- **Arc endHp gap CONFIRMED #1 balance priority** (arc winners 39-46 HP vs single 13-22; muted boss climax). Lever A = per-act HP "exhaustion" cost (5-8 HP/act-end post-heal) → target arc endHp ~28-35; validate arc/normal stays >~60%, arc/nightmare >~25%. → #32.
- Event lethality flat/too low (0 single deaths all diffs; arc/nightmare ~2.3%) → scale loseHp hard×1.25/nightmare×1.5, cap ~40% current HP. → queued.
- UX: deck-view descriptions (#2 ask → #33); draw/discard pile counts in combat HUD (#1 ask, data in combat.drawPile/discardPile); relics HUD overflow at 5+ (silent truncate → "+N more"); map "Unknown event" risk tier; event-result flavor/aftermath line.

## Batch-twelve fresh playtest deltas (2026-06-25)
- #32 arc exhaustion CONFIRMED (arc endHp 30-35, single byte-identical); #29 merge-conflict stable; #31 cards held EXCEPT lucky-dagger still dead (MCTS 0.14 knight / 0.00 apoth — #31's 9→12 dmg insufficient).
- Addressed this batch: #34 event lethality, #35 draw/discard counts, #36 TBD.
- **lucky-dagger still dead** → needs a different lever: a conditional payoff ("×2 if poisoned") needs an engine conditional-effect kind (none exists), OR a non-conditional creative rework. → batch thirteen.
- whirlwind MCTS-dead in single (0.04) but fine in arc (mode-conditional); twin-jab/pommel-strike bottom-third commons; battle-trance still 0.00 knight (draw/energy archetype underbuilt). → batch thirteen card pass.
- single/normal/apothecary ease (0.803, MCTS 1.0) = pre-existing poison-vs-boss seam, NOT an exhaustion artifact; 3.6pp cross-class gap within tolerance — monitor, don't chase.
- **greedy reward policy blind (index-0)** → all greedy pickRate is noise; a heuristic card-scorer (~50 lines in playtest.ts) would make sweeps real signal + likely expose event lethality. → high-leverage tooling, batch thirteen.
- UX: draw/discard pile counts (#1 → #35); relics-HUD silent truncation at 6+/long names → "+N more" (→ #36 candidate); surface event NAME on the map instead of "Unknown event" (deterministic, expressive — design-intent change); deck-view page-2 sparse (cosmetic); event-result "what you chose" recall.

## Batch-14 fresh playtest findings (2026-06-26, on main+batch13)
- Re-baseline (post-#39 smarter greedy drafter — NEW higher baseline, not comparable to old greedy): single normal K0.86/A0.87, hard 0.66/0.60, nightmare 0.49/0.41; arc normal 0.71/0.64, hard 0.49/0.46, nightmare 0.34/0.25. **Arc/hard cross-class gap collapsed 13pp→3pp** (#26+#40). Surviving gaps: single/nightmare +7.7pp, arc/nightmare +9pp (both Knight-favored).
- #40 cards CONFIRMED lifted (MCTS): lucky-dagger arc/apoth 0.32, twin-jab/pommel-strike in commons band, none dominant. #41 event flavor lands (UX validated good/bad).
- HEURISTIC OVER-VALUE (use MCTS as arbiter): greedy rates plague 1.00 / viral-load 0.98 / avalanche 0.94 but MCTS rates them 0.00-0.32 — AoE-poison rares; do NOT trust greedy alone for these.
- **5 confirmed dead cards** (≤0.01 greedy @300+ offers + low MCTS): cleave-the-horde, shield-wall, field-rations, limber, second-breakfast. → #43.
- battle-trance still weak for KNIGHT specifically (0.09 arc) — draw/energy archetype underbuilt for knight (apothecary fine). Queued.
- Queued balance: merge-conflict still #2 arc/nightmare killer (19/300) → phase threshold 30%→20% or late-act relief; apothecary arc/nightmare floor (0.25) → kit card or carryover-poison; single/nightmare gap → a poison-payoff conditional card (now possible via #42); arc endHp 31-33 at nightmare → nudge exhaustion $5→$6/act.
- Queued UX: event-result "you chose X" recall (#1 UX — needs RunState field + SAVE_VERSION bump); shop affordability dimming (#2 → #44); deck-view upgradeable markers (#3 → #44); map "Unknown event" risk/name signal; unlock notifications on the VICTORY screen (not just next title); turn counter in combat HUD; event risk-magnitude previews + deck/status conditional event branches (E5, now enabled by #42 conditions).

## Batch-15 fresh UX playtest (2026-06-26, on main+batch14)
Batch 14 UX CONFIRMED: shop affordability dimming (unaffordable dimmed, prices stay gold) + deck `^` upgrade markers both land. Top UX queue:
- **#1 event-result "you chose X" recall** — result screen shows outcomes but not the chosen option label (acute "what happened?" moment, esp. roll outcomes). Needs the chosen index in EventState → RunState field + SAVE_VERSION bump.
- **#2 unlock notifications on the VICTORY screen** — currently fire on the NEXT title (missed if you start a new run). Thread `justUnlockedNames` into GameOverScreen. Pure UI, low effort. → #46.
- **#3 map "Unknown event" risk/name signal** — no node identity/risk; quickest = a caution color tier; better = surface event name (needs map to carry eventId).
- **#4 shop card-removal** (deck-thinning meta absent) — engine `removeCard` action + shop slot + chooser UI (RestScreen pattern). Bigger.
- **#5 turn counter in combat** — `CombatState.turn` exists, unsurfaced; add to the pile line. Low effort.
- Also: class-blind first-time framing (no "what is this game"/starter preview on title).
