# Increment 65 — Overclocker legibility pass (playtest-driven)

**Branch:** `evo/65-overclocker-legibility` → base `main` · **Commit:** `b6f44f8` · **Pillar:** V (UX).
First increment of batch 22, from the fresh Overclocker UX playtest (which found the class's PAYOFF
was invisible — players sandbagged at low HP and never saw the gradient bonus).

## What it does (pure UI + content text)
1. **Live gradient value in combat (the "aha" fix):** gradient cards (scaleMissingHp) now show a
   warm `now N dmg/blk` line computed from current HP — exactly the engine's
   `amount + floor((maxHp-hp)/N)`. So when you're hurt, you SEE the bigger number. Combat-only;
   plain cards show nothing. (CombatScreen `liveGradient` + a CardTile `live` prop.)
2. **"(won't kill you)"** appended to every overheat (`loseHp`) card description — the floor-at-1
   safety is real (`Math.max(1,…)`), so players stop sandbagging at low HP. Text only.
3. **HEAT chip** in the HUD for a hurt Overclocker (class+hurt-gated, warm color) — so red HP reads
   as "powered up", not just "danger". Never shows for Knight/Apothecary.
4. **Tagline** now conveys BOTH levers: "Burns HP for power; hits harder the more hurt. Crashes
   optional."

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **426 tests** ✅ (+5: live value at reduced+full HP, plain-card exclusion, won't-kill on all loseHp cards, HEAT chip 3-way gating, tagline dual-lever) · `play-verify` PASS
- Pure UI + content TEXT only (cards.ts: only `description` strings; no effects/amounts/cost); theme tokens only; no engine/SAVE_VERSION
- Review — 1 lens, **0 blocking** — PASS (live value verified parity with engine; budget 16 rows/75 cols)

## Batch 22 (in progress)
#66 legibility (this) + #67 balance (reckless-swing MCTS-dead fix + differentiate the
coolant-surge≡frost-plating and meltdown-strike≡overload-blast identical pairs). Balance playtest
verdict: **Overclocker is mechanically HEALTHY** — MCTS single-mode parity 1.0 (normal+nightmare),
no death-spiral, overheat/gradient confirmed functional.
