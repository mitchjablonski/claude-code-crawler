# Increment 67 — Dead-card pass 7 (hybrid cull/buff)

**Branch:** `evo/67-deadcard-pass7` → base `main` · **Pillar:** B (balance).
Human-approved HYBRID approach (deepPairing decision `dec_vv0sDssb4L`): MCTS-confirm each long-dead
common, cull the truly dead, buff the salvageable.

## Why hybrid (not a blind cull)
The five cards read ~0 pick in GREEDY, but greedy is BLIND to exactly their mechanics (dexterity,
weak, multi-hit). MCTS (the arbiter) actually drafts most of them. So culling on the greedy signal
alone would delete fine cards — we cull only what MCTS also rejects.

## "Cull" = SHELVE (save-safe), not delete
Hard-deleting a draftable CardDef would break saved runs whose decks reference its id. Instead a cull
reclassifies `rarity` → `'starter'` — the draft pool is `rarity !== 'starter' && not an
upgrade-target`, so the card LEAVES the draft pool while the CardDef stays resolvable (saves load;
**no SAVE_VERSION bump**), matching the spore-burst/rusty-shortsword starter pattern.

## Outcome (per-card)
| card | mechanic | decision | change |
|------|----------|----------|--------|
| **sidestep** | plain block+draw (no blind-spot) | **CULL (shelve)** — MCTS-confirmed the laggard | rarity common→**starter** (out of draft; in no deck → inert) |
| **tipped-blade** | Apothecary STARTER, also a dead draftable | **SHELVE from draft** | rarity common→**starter** (stays the Apothecary starter + keeps tipped-blade-plus) |
| **limber** | dexterity (greedy-blind) | **BUFF** (MCTS drafts it) | 1→**2** Dexterity (+4 Block) — dex-archetype seed |
| **weakening-jab** | weak (greedy-blind) | **BUFF** | 5 dmg/2 weak → **6/3** (plus 7/3→8/4) |
| **twin-jab** | multi-hit (greedy-blind) | **BUFF** | 4×2 → **5×2** (10 split dmg) |

Verified: sidestep + tipped-blade are no longer in the draft pool (rarity=starter); the other three
remain draftable commons; 107 cards total (quota floor 50). Buffs are modest (+1 stat), peer-
calibrated, not new auto-picks.

## Determinism / saves
Only these 5 cards (+2 -plus) changed; other cards byte-identical; `run(seed)===run(seed)` holds.
**SAVE_VERSION unchanged** — reclassify-not-delete keeps all CardDefs resolvable; buffs are stat
changes on existing ids.

## Verification
- typecheck ✅ · lint ✅ · **426 tests** ✅ · `play-verify` PASS · `cards.ts` only · tipped-blade still in APOTHECARY_DECK
- **Self-reviewed** (not an independent lens): agent dispatch was access-blocked mid-batch, so the
  main loop implemented + verified this directly. Low-risk content change (2 save-safe
  reclassifications + 3 modest buffs); recommend a quick reviewer pass on next opportunity.

## Note on the greedy blind spot
The buffs to limber (pure dex) won't fully lift its GREEDY pick-rate (greedy ignores dexterity
entirely) — that's an accepted greedy limitation, not a card defect; MCTS values it. The decisions
here are MCTS-grounded, consistent with the standing "MCTS is the arbiter" insight.

## Batch 23
#68 dead-card pass 7 (this). Queued next: the `overdrive-core` "convert HP-loss→Strength"
class-asymmetry redesign (needs a small on-HP-loss trigger).
