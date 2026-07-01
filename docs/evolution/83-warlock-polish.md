# Increment 83 — Warlock polish, legibility & final sweep (Warlock epic D)

**Branch:** `evo/83-warlock-polish` (stacked on `evo/82-corrupted-core`) → base `main`
**Pillar:** content + PURE UI. Warlock epic 4/4 — the capstone: thematic events, hex legibility,
and the final 4-class balance sweep. **No engine mechanics; theme tokens only.**

## What it adds

### 1. Two thematic events (`src/engine/content/events.ts`)
- **The Bloodpact Altar** (`bloodpact-altar`, `hiddenOnMap: true`) — a dark-pact GAMBLE. Options:
  (0, ungated, greedy pick) *"Sign in a drop of your own blood"* → `gainMaxHp 6 / loseHp 4` (a
  measured, class-agnostic net-positive — the proven overclock-altar economics, so being the greedy
  pick can never regress a class); (1, ungated, human-weighed) *"Let the altar drink its fill
  (risky)"* → `rollOutcomes` [`drain-touch`] / [`drain-touch` + `loseHp 6`] / [`loseHp 12`] weights
  `[2,2,1]` (byte-identical economics to the proven overclock-altar redline gamble; reward is a
  drain card — Warlock-flavored but shared-pool); (2, ungated) *"Refuse the pact"* → safe exit.
- **The Withered Reliquary** (`withered-reliquary`, revealed) — a Corrupted-Core / hex decision.
  Options: (0, ungated, greedy pick) *"Siphon a careful trickle"* → `gainMaxHp 5 / loseHp 2`
  (class-agnostic net-positive); (1, GATED `relics ≥ 2`) *"Copy the reliquary's binding to a page"*
  → `gainCard wither` (a 0-cost shared-pool hex cantrip); (2, ungated) *"Seal it back into the rot"*
  → safe exit.
- Each keeps ≥1 ungated option (anti-stall); the greedy first-ungated option is net-positive so no
  class regresses; every `gainCard`/`gainRelic`/`loseGold` id resolves; snarky tone throughout.
  Curation: the gamble is the map mystery (`hiddenOnMap` + `rollOutcomes`); the decision stays
  revealed (#69 convention). Events now 17 total, 7 hidden → mystery fraction 0.41 (in-range).

### 2. Legibility (pure presentation, theme token only)
- **Hex recolored `blue` → `cyan`** (`src/ui/theme.ts`). #80 gave hex `blue`, but weak is ALSO
  `blue`, and the two can sit in the SAME enemy status row (e.g. `hex-bolt` applies Weak, then a
  curse applies Hex to that enemy) — they blurred. `cyan` is distinct from BOTH weak (`blue`) and
  poison (`magenta`, the other DoT), reads as a cold spectral corruption glow (on-theme for the
  Corrupted Core act), and — crucially — is UNUSED by any other **status chip**: `block`/`accent`
  also read cyan, but those are resource/structural tokens rendered in separate HUD regions, never
  as a status chip, so hex never collides with another chip in the status row. (Precedent: #71
  overcharge borrows red from strength/hp/danger.) `theme.test` updated to assert hex ≠ weak
  (keeping hex ≠ poison).
- **Warlock reads on the TITLE class-select** — its name + tagline render under `[k] Class`
  (confirmed by render below).
- **Drain +Nhp and hex beats read clearly in combat** — confirmed by the render below (a single
  `life-tap` shows `+3hp` on the player HUD and `+2HEX` on the enemy in one action).

## Renders (budgets ≤30 rows / ≤76 cols)

TITLE class-select — cycled to Warlock via `[k]` (25×76):
```
│ — Your hero —                                                            │
│ [k] Class: Warlock                                                       │
│     Drains enemies to heal and hexes what won't die. Your HP is a share… │
```
Warlock combat one-off — `life-tap` = DRAIN (`+3hp`) + HEX (`+2HEX`) in one action (15×75):
```
 HP 37/56 +3hp  BLK 0  EN 2/3                                 50g  pots 0/3
 ...
     {~x~} Hex Daemon 34/40 -6 [HEX 2] +2HEX
       [#########-]  next: vv Curse Brand  HEX 3
```

## Final 4-class balance sweep (greedy@200 single + arc)
| class | single | arc | single/nightmare | arc/nightmare |
|---|---|---|---|---|
| knight | 1.00 | 0.955 | 0.985 | 0.795 |
| apothecary | 0.98 | 0.930 | 0.870 | **0.695** |
| overclocker | 0.99 | 0.900 | 0.785 | 0.600 |
| warlock | 1.00 | 0.975 | 0.985 | 0.870 |

**Single-MCTS parity spot-check (30 runs, 200 iters):** all four win **1.00**; endHp on win —
knight 21.4 / **warlock 21.1** / apothecary 16.6 / overclocker 14.5.

**Warlock — LEAVE AS-IS (56 HP, sustain untouched).** Greedy shows the Warlock hottest at nightmare
(arc 0.87 vs peers 0.60–0.80) with high greedy endHp (single normal 51/56), which trips the
"face-tank" watch-flag from increment B. But single-MCTS resolves it: under skilled play the Warlock
wins at parity (1.00) and ends at **21.1 HP — statistically identical to the knight's 21.4**, NOT
pinned near max. The greedy lead is the same piloting artifact the epic already flagged, mirrored:
greedy OVER-credits the Warlock's one-ply "heal on every hit" sustain exactly as it UNDER-credits
the overclocker glass cannon (arc/nightmare 0.60). MCTS parity + honest endHp = balanced; no tune
(and increment D's scope forbids engine/content mechanic changes anyway).

**Apothecary nightmare-arc — LEAVE AS THEMATIC (recommended).** Measured 0.695 (greedy@200; the
#82 "~55%" figure predates #82's post-tune act-3 ramp/boss-HP softening). It is winnable, mid-pack
(above the overclocker's 0.60), and single-MCTS is 1.00. A block-light poison class *should* struggle
against the Corrupted Core act's block-bypassing hex enemies — that is meaningful class identity, not
a defect. No tune.

## Determinism / saves
- Events are content (ids); the hex recolor is pure presentation. **`run(seed)===run(seed)` holds**
  (seeded greedy digest `diff`-identical across two identical invocations). Existing content
  byte-identical (additions/text only). **SAVE_VERSION unchanged (12).**

## Verification
- typecheck ✅ · lint ✅ · **504 tests** ✅ (+2: #83 events resolve/ungated/hiddenOnMap-curated +
  greedy-pick-is-not-the-gamble; theme hex ≠ weak assertion added). No tests weakened.
- `play-verify --runs=120` → **PASS** (4 classes; warlock single 1.00, arc 0.967).

---

## Epic recap — "Warlock" (A → D)
- **A (#80, `evo/80`)** — engine primitives: `lifesteal` on damage effects (DRAIN — heal a fraction
  of post-mitigation damage, capped at missing HP) and the `hex` status (a poison-shaped, block-
  bypassing round-end DoT that ALSO siphons `floor(hex/2)` to the caster). Save-safe: new optional
  `Statuses` key, no SAVE_VERSION bump.
- **B (#81, `evo/81`)** — the **Warlock class**: 56 HP (lowest of four), starter kit teaching both
  levers turn one (`siphon-fang` drain + `curse-brand` hex), the `siphon-sigil` starter relic, and a
  full draftable "curse, then drain" pack (hex-feast / hex-siphon / hex-reaper payoffs, `life-tap`,
  drain cantrips). Greedy/scorer taught to value drain + hex.
- **C (#82, `evo/82`)** — the **Corrupted Core act**: ARC 3→4 acts, a new deepest boss act, 4 tier-4
  enemies including `hex-daemon` (hexes the PLAYER) and the phased `the-corrupted-core` boss;
  tier-gated elite spawns; single mode byte-identical.
- **D (#83, this)** — polish: 2 thematic pact/Corrupted-Core events, hex legibility (blue→cyan, off
  weak's hue), Title + combat legibility confirmed, and the final 4-class sweep proving the whole
  epic (drain/hex + Warlock + Corrupted Core) leaves all four classes balanced.
