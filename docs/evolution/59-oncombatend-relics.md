# Increment 59 — onCombatEnd relics (D9 depth)

**Branch:** `evo/59-oncombatend-relics` → base `main` · **Commit:** `529cd25` · **Pillar:** D (depth).
The long-queued "D9" relic-trigger item.

## Why
Relics fired only DURING combat (combatStart/turnStart/onCardPlayed/onKill). There was no
out-of-combat sustain lever — important for arc/multi-act survival. Add post-victory healing relics.

## What it does
New relic trigger **`onCombatEnd`**, fired on combat VICTORY and applied to the RUN (not combat):
- **Structural note:** unlike every existing trigger (which mutates `CombatState` mid-fight),
  onCombatEnd runs AFTER combat via a new `applyRelicsToRun` helper in `finishCombat` (run.ts) —
  the single victory chokepoint (regular AND boss wins; never reached on defeat, no flee path).
  Heals run hp: `hp = min(maxHp, hp + amount)`. Heal-ONLY (guarded — non-heal kinds throw, since
  damage/block/status/etc. are meaningless post-fight). Returns the same state ref when nothing
  heals → strict no-op for non-owners.
- **Relics:** `field-dressing` "After each victory, heal 4 HP" (heal 4, CORE → elite pool, peer to
  troll-tooth's heal-3-at-start); `surgeons-satchel` "After each victory, heal 6 HP" (heal 6,
  unlock-gated behind `three-victories`, wired into milestones — E2 pattern).

## Determinism + saves (verified)
- onCombatEnd consumes NO rng and runs after the combat rng stream closes → existing seeded runs
  are BYTE-IDENTICAL whether or not owned. The `run('alpha')` determinism test is unchanged; a new
  test asserts owner.rng deep-equals non-owner.rng after an identical winning combat. Existing
  cards/relics/content untouched (only appends).
- **SAVE_VERSION NOT bumped** (stays 11): relics serialize as IDS, `trigger` is static content on
  `RelicDef` (never serialized), RunState shape unchanged → no migration; old saves load.

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **387 tests** ✅ (+5: victory-heal, cap-at-maxHp, non-owner no-op, rng-free byte-identical, no-fire-on-defeat; content.test trigger-list + heal-only invariant)
- `play-verify` PASS (apothecary single 0.91 / arc 0.81 — healthy); modest heals on a ~6-relic run, not auto-pick-dominant

## Review — 1 lens, **0 blocking** — PASS
determinism airtight; victory-only firing confirmed; cap/no-op/heal-only guard; SAVE_VERSION call correct; pool/unlock placement consistent with peers.

## Batch twenty (in progress)
#59 onCombatEnd relics (this) + a UX legibility pass (#60, from the fresh UX playtest) + #61 (from
the balance playtest). Fresh UX playtest surfaced 5 small pure-UI fixes (unplayable-card feedback,
rest-heal as a number, block-absorption beat, map-node stakes, `disc`→`discard`).
