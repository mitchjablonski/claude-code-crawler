# Increment 73 — Combat hand compaction (visual pillar)

**Branch:** `evo/73-hand-compaction` → base `main` · **Commit:** `e3974e9` · **Pillar:** V (visual/UX).
Polish-loop increment 1/4. Fixes the row overflow #72 introduced + a queued footer item.

## What it does (pure UI — CombatScreen only)
- **Combat hand: bordered tiles → compact one-line-per-card list.** Each card is now one aligned
  row `[N] (C) NAME  TYPE  DESC…`: the name column auto-sizes to the widest card and NAMES NEVER
  TRUNCATE; cost pip + colored type preserved; description gracefully `…`-truncated (full text is one
  `[v]` away); the combat-only `live` "now N" missing-HP gradient survives. **Combat-only:**
  `CardTile` is untouched, so REWARD and SHOP keep their rich bordered tiles (zero regression).
  Rationale: combat's enemy rows are already terse text; the hand now matches → a unified, scannable
  combat language. Considered + rejected narrow 3-per-row tiles (they mangled names at width 24).
- **Footer ≤76:** tightened the combat footer wording (`[v] view deck`→`[v] deck`, etc.) so the
  worst case (unplayable + potions + deck) fits — was ~83 cols, now ~55.

## Result
- **3-enemy + full 5-card hand: 34 → 20 rows** (hand zone ~18 → ~6); ≤76 cols. Fixes the #72 overflow with room to spare.
- Reward 18 rows / Shop 27 rows — unchanged (CardTile untouched).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **454 tests** ✅ (+4: row budget ≤28, single-line/no-border, names-never-truncated, live-gradient-survives; footer assertion updated) · `play-verify` PASS · pure UI, theme tokens only, no engine/SAVE
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS; taste verdict: "clear improvement, coherent with the terse enemy rows"

## Polish backlog (from review)
- Minor: on an UNAFFORDABLE hand row the cost pip doesn't actually un-dim (ink doesn't emit an
  un-dim to cancel the parent `dimColor`), so the `dimColor={false}` intent isn't achieved — the pip
  renders dimmed but stays legible via its magenta tint. Cosmetic; a future tidy.

## Polish loop (batch, stacked, merge in order)
#74 hand compaction (this) → #75 economy screens → #76 map/event → #77 color-cohesion.
