# Increment 18 — E6: git-push signal

**Branch:** `evo/18-git-push` → base `evo/17-juice` (stacked)
**Pillar:** E (engagement) · **Commit:** `5103665`

## What it does
A `git push` ("ship it!") becomes a celebratory game moment — mirroring the E4
lint/commit pattern. Entirely flavor-layer; no engine change.

- `classify`: a Bash `git push` → new `pushed` event (verdict-independent), ordered
  before `git commit` so the two never collide and `push` never falls through to
  build/test/lint/activity.
- `ruleFor('pushed')` → `blessNextCombat strength 1` ("ship-it confidence" into the
  next fight), snark-tiered. Rate limit `{capacity:1, refillPerMinute:0.25}` — the
  tightest in the table.
- `lint-and-ship` simulate scenario now ends lint→test→commit→**push**→Stop.

## Bounded / unfarmable (verified)
Double-bounded: the push bucket throttles intake to ~1 bless / 4 min, AND the engine
caps `nextCombatStatuses` at `MAX_BLESS_STACKS=3` and **resets it at combat start** —
so a `git push` storm / CI retry loop can never exceed +3 Strength into any combat
(and realistically can't approach +3 from pushes before a combat consumes them).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **248 tests** ✅ (push variants → pushed; commit still committed; non-git unaffected; rule mapping + snark tiers; simulate ordering)
- `play-verify` **PASS**; all feature flags true; empty `src/engine/` diff (pure flavor layer)

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / scope | PASS | Pure flavor-layer (events + modifiers only); classify total; push/commit ordering correct + well-tested; tests strengthened (old "push → activity" replaced). |
| Balance / design | PASS | Bounded/unfarmable; commit=checkpoint-heal + push=ship-it-strength completes the vocabulary; on-tone snark. |

### Deferred → backlog E6
`pushed` shares its exact modifier with `agent_spawned` (both `blessNextCombat strength 1`); narration differs but mechanics coincide — giving push a distinct mechanical fingerprint is a flavor taste-call left for human judgment. Also still queued: a distinct test/build-failure elite; `long_thinking`/`big_diff` (need new hook payloads).

## Batch six complete
Increments E2 (meta-progression), V6 (juice), E6 (git-push) — PRs #16/#17/#18.
