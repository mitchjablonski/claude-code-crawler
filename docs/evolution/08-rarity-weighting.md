# Increment 08 — D3: Card rarity + reward weighting (depth-scaled)

**Branch:** `evo/08-rarity-weighting` → base `evo/07-arc-balance` (stacked)
**Pillar:** D (depth) · **Commits:** `fd07991` (impl), review-fix commit follows

## What it does
Flat rarity weighting already existed (common 60 / uncommon 30 / rare 10). D3 adds
the missing dimension: **depth-scaled** weighting — deeper acts skew toward higher
rarity, pairing with D7's per-act enemy escalation (harder fights → better loot).

`RARITY_WEIGHTS_BY_ACT` indexed by `node.act`, threaded into `rollCardChoices` at
both call sites (combat reward + shop):
| act | common | uncommon | rare |
| --- | --- | --- | --- |
| 0 | 0.60 | 0.30 | 0.10 |
| 1 | 0.52 | 0.34 | 0.14 |
| 2+ | 0.46 | 0.36 | 0.18 |

**Act 0 is held exactly at the historical `[0.6,0.3,0.1]`** — same pattern as D7's
`actHpRamp[0]=1.0` — so single mode (act 0 only) reward/shop draws stay
byte-identical. Only arc's deeper acts change.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **180 tests** ✅ (act-0 byte-identical-to-flat proof, monotonic tilt, act-2 > act-0 higher-rarity share over 20k seeded rolls, exclusions + dedupe at every act, clamp)
- `play-verify` **PASS**; feature flags all true
- realized distribution (20k rolls/act): act0 60/30/10 → act1 52/34/14 → act2 46/36/18; rare stays a clear minority (no flooding)

## Review — 3 lenses (no UI change → visual skipped)
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / determinism | PASS | Act-0 byte-identical (real reimplementation test, not tautology); no act-0 fixture changed; exclusions preserved; no SAVE_VERSION impact. |
| Balance / distribution | PASS-WITH-NITS | **D3 did NOT loosen arc — it slightly tightened knight** (gaps +8…+10 → +5…+7). Apothecary unchanged. Modest, monotonic tilt. |
| Design | PASS | Clean data-driven model mirroring D7's act-0-baseline + clamp; shop price escalation already rarity-driven, so one table suffices. |

### Parity (greedy@300) — D7 → D3, single byte-identical
| Char | Diff | single | arc(D7) | arc(D3) |
| --- | --- | --- | --- | --- |
| knight | normal | 0.62 | 0.72 | **0.67** |
| knight | hard | 0.42 | 0.50 | **0.49** |
| apothecary | normal | 0.76 | 0.66 | 0.63 |

### Findings addressed
1. Dropped a redundant type cast in `rarityWeightsForAct`.
2. Fixed the "act 2+" comment to note higher acts clamp to the deepest row.
3. Queued (backlog E5): a rarity-seeking playtest policy (greedy is rarity-blind, so it under-tests the tilt's intended power gain — distribution is unit-tested, the power claim rests on design); and tracked apothecary-arc-normal (~−13pt) as the weakest balance seam (pre-existing kit asymmetry).

### Deferred
The greedy harness under-measures the rarity power-gain (takes reward index 0); the
distribution mechanics are unit-tested. Per-character arc parity stays a known
kit-asymmetry (would overfit the greedy proxy).
