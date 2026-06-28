# Increment 60 — UX legibility pass (playtest-driven)

**Branch:** `evo/60-ux-legibility` → base `main` · **Commit:** `4af1751` · **Pillar:** V (UX).
Bundles the 5 small pure-UI fixes from batch 20's fresh UX playtest.

## What it does (pure UI — `src/ui/**` only)
1. **Unplayable-card feedback** (CombatScreen): pressing an unaffordable card used to silently
   no-op. The footer now shows `· N unplayable` (derived live: `hand.filter(cost > energy)` — no
   new state), only when >0. The playtest's worst new-player moment.
2. **Rest heal as a number** (RestScreen): `heal 20% of max HP` → `heal N HP`, computed
   `Math.floor(maxHp * HEAL_PCT/100)` — mirrors the engine's `Math.floor(maxHp*0.2)` EXACTLY
   (verified identical for maxHp 1–2000), so the label never lies. A decision made every few nodes.
3. **Block-absorption beat** (StatusBar): block gain showed `+Nblk`, but absorbing a hit was
   invisible. Added a `-Nblk` beat (prior-diff mirror of blockGain, same timing) — closes the
   defensive feedback loop.
4. **Map-node stakes** (MapScreen `KIND_LABEL`): `Rest site (heal or upgrade)`, `Shop (spend
   gold)`, `Unknown event (risk/reward)`, `ELITE combat (harder, better loot)`. Boss/normal/start
   unchanged. One-object diff.
5. **`disc` → `discard`** (DeckView combat mode): title + per-row pile tag spelled out (fits the
   DESC width — no wrap).

## Verification (independently reviewed + eyeballed)
- typecheck ✅ · lint ✅ · **390 tests** ✅ (+8: footer unplayable/none, rest HP number + no `%`, block-loss beat, map stakes ≤76, DeckView `discard`; none weakened)
- `play-verify` PASS; pure UI (10 files, all `src/ui/**`); theme tokens only; no engine/SAVE_VERSION
- Worst-case combat footer (potion + view-deck + unaffordable) renders at 75 cols with the `[v]` key preserved (only the redundant "iew deck" clips) — acceptable

## Review — 1 lens, **0 blocking** — PASS
each fix correct; rest-formula parity proven; blockLoss timing matches blockGain; footer clip acceptable. Nit: `·` is non-ASCII (already used in GameOverScreen — consistent; kept).

## Batch twenty
#59 onCombatEnd relics (depth / PR #60) + #60 UX legibility pass (this) + #61 (pending balance
playtest). The fresh UX playtest rated the game "in good shape" — these were all subtle, none "where's
the play button." Good "keep" signals: enemy intent chips, shop dimming-with-reasons, rest upgrade diff.
