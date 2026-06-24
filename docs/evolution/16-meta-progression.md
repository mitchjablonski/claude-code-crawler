# Increment 16 — E2: Meta-progression

**Branch:** `evo/16-meta-progression` → base `evo/15-status-icons` (stacked)
**Pillar:** E (engagement) · **Commits:** `0d65730` (impl), review-fix commit follows

## What it does
Cross-run **unlocks** for replayability. 8 EXTRA cards/relics are gated out of the
draft pool until earned via milestones; the core balanced content + both classes stay
always-available (purely additive — no regression for fresh players).

- **Unlocks derived from run history** (`MetaState.runs`) by a pure `deriveUnlocks` in
  `src/progression/milestones.ts` — no separate "unlocked" save field to drift.
  Milestones: first victory (2 cards), first hard+ victory (relic + card), first arc
  victory (card), 3 victories (card + 2 relics).
- `RunRecord` gained optional `difficulty`/`mode`/`character` (captured at run-end).
- New content carries an `unlock` flag → derived `UNLOCKABLE_CARD_IDS`/`_RELIC_IDS`
  (mirrors `UPGRADE_TARGET_IDS`). Gating is by `allowedUnlockIds` on `RunConfig`+`RunState`;
  `rollCardChoices`/elite-relic/shop exclude unlockables unless in the allow set.
- Title shows `Unlocks: N/M` + a "NEW unlocked!" flash.

## The two hard invariants — both verified
1. **Byte-identical core.** `DEFAULT_RUN_CONFIG` (fresh players + the harness) has an
   empty allow set → every unlockable is excluded → the draft/relic pools and rng draws
   are identical to pre-E2. Balance harness win-rates **match the batch-five baseline
   exactly** (single 0.66/0.77, arc 0.65/0.58).
2. **Run history survives.** Meta is versioned **separately** (`META_VERSION`, decoupled
   from the run `SAVE_VERSION 7→8`) and `loadMeta` **migrates** (keeps valid records,
   normalizes version forward) — never quarantines history on a version delta. A v7
   in-progress run quarantines (transient); meta.json is untouched.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **238 tests** ✅ (byte-identical default draws; unlock gating excludes-by-default + includes-when-allowed; `deriveUnlocks` from history incl. graceful old records; **old-version meta preserved (no quarantine)**; v8 round-trip; v7 quarantine)
- `play-verify` **PASS**; balance matches baseline
- title.png: `Unlocks: 0/8` + hint, clean within the chrome

## Review — 4 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / determinism | PASS | Byte-identical core proven; allow-set on RunState (resumed runs deterministic); SAVE_VERSION 8 + v7 quarantine. |
| Persistence / back-compat | PASS | **No code path wipes run history**; META_VERSION decoupled; loadMeta migrates; old records load (optional fields). |
| Balance / design | PASS-WITH-NITS | Win-rates match baseline; classes never gated; unlockables mostly fair. |

### Findings addressed
1. Toned down `veterans-banner` (was strictly-better than core war-paint via a permanent free draw/combat → now +1 Str/+1 Dex/+5 Block, no power-creep).
2. Hardened `loadMeta` to guard `settings` is a plain object.
3. Queued backlog **E7**: smooth the front-loadable milestone curve (a variety milestone) + richer Title UX (which milestone unlocks what / locked teaser).

### Deferred → E7
Milestone-curve smoothing; locked-content teaser UI; the class-unlock framework exists but is unused (no new class authored yet).
