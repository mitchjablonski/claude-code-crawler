# Increment 22 — Dead-card balance pass (playtest-driven)

**Branch:** `evo/22-card-balance` → base `evo/21-hud-relics` (stacked)
**Pillar:** D (balance) · **Commit:** `6ed0e67`

## Why
The Sonnet balance playtester found 4 cards MCTS NEVER drafts (dead slots) + 1
auto-pick rare. Reworked them (content-only; existing Effect kinds):

| Card | Before | After |
| --- | --- | --- |
| battle-trance | draw 3 /1 | draw 2 + gain 1 energy /1 (energy-neutral cycle, distinct from adrenaline-rush) |
| avalanche | 12 dmg all /3 | 12 dmg all + draw 1 /2 (affordable rare AoE) |
| corrosive-mist | 4 poison all /2 | 6 poison all + gain 1 energy /2 (tempo-neutral) |
| juggernaut | 2 Str + 1 Dex /2 | 2 Str + 1 Dex /1 (split-stat pays off on tempo) |
| troll-blood | regen 5 /2 | regen 4 /2 (tempered from auto-pick) |

## Result (MCTS@100 pickRate, arc/knight — the decisive multi-enemy sample)
| Card | Before | After |
| --- | --- | --- |
| battle-trance | ~0 | 0.25 |
| avalanche | ~0 | 0.27 (arc; ~0 single = correct, single-target boss) |
| corrosive-mist | 0.00 | 0.27 |
| juggernaut | ~0 | 0.35 |
| troll-blood | 0.56–0.67 (auto-pick) | 0.32 (peer band: phoenix 0.34, last-bastion 0.31) |

All 4 dead cards now competitively drafted; troll-blood no longer dominant; none over-tuned (highest reworked = juggernaut 0.35 ≈ top peer phoenix-feather 0.34). Greedy win-rates stable + non-degenerate (single knight 0.733 / apoth 0.77; arc 0.71/0.62).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ (clean — also removed a stale agent worktree that was polluting `eslint .`) · **265 tests** ✅
- `play-verify` **PASS**; single-file diff (`cards.ts`); no engine/SAVE_VERSION change

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Balance | PASS | 4 dead cards drafted, troll-blood in peer band, no over-tuning, win-rates stable. |
| Regression / scope | PASS | Content-only (1 file); existing Effect kinds; no `-plus`/derived-set inconsistency; determinism preserved; quotas hold. |

### Deferred → backlog
Arc-Knight-lead balance debt (from #20) remains queued (per-mode/class knob).
