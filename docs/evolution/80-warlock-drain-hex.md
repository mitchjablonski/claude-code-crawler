# Increment 80 — Warlock engine: drain + hex (epic A)

**Branch:** `evo/80-warlock-drain` → base `main` · **Commit:** `45f345d` · **Pillar:** D (depth).
First of 4 increments for the human-approved **Warlock** epic (4th class + a new act). Engine-only —
no content yet.

## Two pure primitives (rng-free, no SAVE bump)
1. **`drain` (proportional lifesteal)** — optional `lifesteal?: number` (fraction) on the `damage`
   effect. A drain attack heals the PLAYER for `floor(totalDealt × lifesteal)`, where totalDealt is
   the POST-mitigation damage (after strength/vulnerable/block), summed across `times`/`allEnemies`,
   capped at maxHp. Strict no-op when absent or fully blocked (0 dealt). Enemy attacks never
   lifesteal (`applyEnemyEffect` untouched). This is the class's sustain engine — heal scales with
   your curses/strength.
2. **`hex` (new life-siphon CURSE status)** — at round-end each hexed enemy loses `hex` HP (bypassing
   block, like poison) AND the player heals `floor(hex/2)` (summed, capped); hex decays 1/round.
   The caster-feed is what makes it DISTINCT from Apothecary's poison (poison doesn't heal you).
   Composes cleanly with poison/regen at round-end (single clamp, no double-count). `HEX` chip in a
   theme token (blue — distinct from poison's magenta).

## Determinism / saves
Both rng-free; no content uses them yet → existing seeded runs BYTE-IDENTICAL (inert-content test
holds); `run(seed)===run(seed)` passes. **SAVE_VERSION unchanged (12)** — `hex` is a new optional key
in the `Partial<Record<StatusId,number>>` status maps; `lifesteal` is static Effect content (not
serialized).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **490 tests** ✅ (drain: levels/strength/cap/blocked-noop/multi-hit/AoE/
  no-rng/enemy-inert; hex: siphon/decay/block-bypass/cap/no-rng; content.test hex + lifesteal range;
  determinism inert) · `play-verify` PASS · pure (no timers/rng), no engine wall-clock
- Review — 1 lens, **0 blocking** — PASS (info nit: hex shares blue with `weak` — distinct from
  poison as required, different glyphs; revisit in the legibility pass if it blurs)

## Next (Warlock epic, stacked, merge in order)
A drain+hex (this) → B the class (maxHp 56, drain/curse kit) → C new act "Corrupted Core" → D
events/legibility + final 4-class sweep.
