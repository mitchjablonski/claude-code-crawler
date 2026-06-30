# Increment 69 — Map event-naming: Tiered reveal (design-approved)

**Branch:** `evo/69-map-event-naming` → base `main` · **Commit:** `146bbb2` · **Pillar:** V/E (UX + engagement).
The long-pending map event-naming DESIGN CALL — resolved via deepPairing (`dec_fCwnDoVtt-`): the human
chose **Tiered reveal** (name most, keep some "???") over Scouting / Status-quo, honoring their
"some unknowns are good" lean.

## What it does (engine + content + UI)
- **eventId at map-GENERATION:** `createRun` now assigns each event node's `eventId` on the seeded
  `'map'` stream (sorted node-ids × sorted event-ids → stable/reproducible), stored on the new
  `MapNode.eventId?`. `enterEvent` reads the STORED id and consumes NO rng — so the event NAMED on
  the map is exactly the event PLAYED (no desync by construction).
- **Tiered mystery:** new `EventDef.hiddenOnMap?` flag, curated `true` on the 5/12 (~42%)
  high-variance `rollOutcomes` gambles (abandoned-vending-machine, abandoned-armory,
  traveling-alchemist, whispering-well, overclock-altar) — so mystery tracks STAKES. The other 7
  (stat-gates / fixed trades) are revealed by name.
- **MapScreen** per-node labels: revealed events show their NAME + the `(risk/reward)` tag; hidden
  ones show "??? Unknown event". The hidden event's real name is never rendered anywhere (verified —
  only MapScreen + EventScreen read events; EventScreen only for the event being played).

## Determinism / saves
- Moving the roll gen-ward SHIFTS seeded runs (expected + human-approved). `run(seed)===run(seed)`
  still holds. Cards/content otherwise byte-identical.
- **SAVE_VERSION 11 → 12** (MapNode shape changed). `loadRun` QUARANTINES on mismatch (old
  in-progress runs are discarded — the established run-save pattern; META/progression untouched, no
  migration code).

## Verification (independently reviewed)
- typecheck ✅ · lint ✅ · **431 tests** ✅ (+5: eventId assigned to every event node; entry uses
  stored id with no rng; MapScreen names revealed + keeps hidden "???" + never leaks the name;
  hiddenOnMap boolean + ~1/3 fraction; mystery ⟺ rollOutcomes) · `play-verify` PASS · render ≤76 cols
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS (nits: no single combined map==played assertion —
  holds by construction, both halves tested; truncation defensive-only)

## Batch 24 complete
#69 overdrive-core class-asymmetry redesign (PR #69) + #70 map event-naming Tiered reveal (this).
Both PRs vs main, independently reviewed, awaiting merge (independent — either order; types.ts edits
are non-adjacent).
