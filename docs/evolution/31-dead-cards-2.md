# Increment 31 — 2nd dead-card pass (playtest-driven)

**Branch:** `evo/31-dead-cards-2` → base `evo/30-rest-preview` (stacked)
**Pillar:** D (balance) · **Commit:** `e508680`

## Why
Batch-ten balance playtest flagged four cards MCTS-drafted <15%. Reworked them
content-only (existing Effect kinds):

| Card | Before | After |
| --- | --- | --- |
| viral-load | poison 8 /2 | poison 10 + gain 1 energy /2 |
| lucky-dagger | 9 dmg + draw 1 /2 | 12 dmg + draw 1 /2 |
| berserker-brew | 3 Str /2 | 3 Str + 1 Dex /2 |
| torch-jab | 6 dmg + 1 Vuln /1 | 8 dmg + 1 Vuln /1 |
(`-plus` variants of lucky-dagger/torch-jab bumped consistently.)

## Result (MCTS@100 pickRate, pooled before→after) + a key correction
A FRESH MCTS playtest (run concurrently) corrected the batch-ten finding: only **two**
of the four were actually dead (the batch-ten flags were partly greedy-noise):
| Card | before → after | verdict |
| --- | --- | --- |
| viral-load | 0.27 → **0.49** | confirmed-dead → lifted into upper peer band |
| lucky-dagger | 0.08 → **0.13** | confirmed-dead → lifted off the floor (still weakest — see nit) |
| berserker-brew | 0.30 → 0.37 | was NOT dead; mild buff, stays peer-band (no overshoot) |
| torch-jab | 0.29 → 0.30 | was NOT dead; buff statistically flat |

Greedy@300 win-rates non-degenerate, mild uniform +0.01–0.05 (single knight 0.767 / apoth
0.793; arc reasonable). No card pushed into dominance.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **302 tests** ✅
- `play-verify` **PASS**; single-file diff (`cards.ts`); no engine/SAVE_VERSION change; determinism preserved

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Balance | PASS-WITH-NITS | viral-load + lucky-dagger lifted; berserker-brew/torch-jab buffs harmless (no overshoot) → **keep all four**. |
| Regression / scope | PASS | Content-only; existing effects; `-plus` consistent, no `unlock` gating; determinism preserved. |

### Nits → backlog
- **lucky-dagger still weakest rare** (0.13) — raw single-target damage at /2 loses to commons in MCTS; needs a stronger lever (a rider: draw 2 / a status) in a future pass.
- Scope: berserker-brew + torch-jab weren't actually dead (fresh MCTS) — buffs were harmless but unneeded; the live card stats also differed from the batch-ten playtest's (stale) descriptions.
- Other MCTS-weak cards surfaced for a future pass: whirlwind, twin-jab, pommel-strike.
