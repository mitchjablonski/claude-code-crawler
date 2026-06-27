# Increment 49 — Shop card removal / deck-thinning (playtest-driven)

**Branch:** `evo/49-shop-removal` → base `main` · **Commit:** `092dc72`
**Pillar:** D (gameplay feature).

## Why
Deck-thinning (paying to remove a weak/starter card) is a core deckbuilder mechanic that was
MISSING — decks bloated with no way to prune. UX playtest #4.

## What it does
- **Engine**: `removeCard` action — removes a chosen deck card at a shop for `SHOP_REMOVAL_COST`
  50g, **once per shop visit** (`shop.removeUsed`, reset on each shop entry), with a `MIN_DECK_SIZE`
  5 floor. Rejects (EngineError): not in shop / already used / gold<50 / deck at floor / bad index.
  Deterministic (no rng). `legalActions` enumerates it per eligible slot (search-visible).
- **UI**: a `Services:` `[r] Remove a card 50g` affordance (dims with an inline reason —
  "need more gold" / "already used" / "deck too small") opening a paginated deck chooser
  (mirrors RestScreen/DeckView); select to remove, `[esc]` cancels.

## Determinism / persistence
Runs that DON'T remove are byte-identical to main (`run('alpha')` + greedy replay unchanged;
`removeUsed=false` set deterministically, no rng consumed). **SAVE_VERSION 10→11** (shop shape
gained `removeUsed`): v10 quarantines, v11 round-trips; META untouched.

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **366 tests** ✅ (remove charges/removes/marks-used; rejects poor/at-floor/bad-index/not-shop; v10 quarantine + v11 round-trip; determinism)
- `play-verify` PASS (+ `removedCard` flag); shop + dimmed + chooser one-offs render within the 30-row budget, theme-tokenized

## Review — 2 lenses, 0 blocking
| Lens | Verdict | Notes |
| --- | --- | --- |
| Regression / determinism / persistence | PASS | non-removing byte-identical, no rng; all rejection rules tested; SAVE_VERSION 10→11 quarantine+round-trip; legalActions legal; gold/floor correct. |
| Design / shop UX | PASS-WITH-NITS | affordance + chooser legible, reuse pattern, fit budget. Nits: chooser keypaths covered E2E but not unit-tested; no removal-confirm (consistent w/ existing no-confirm pattern; esc + deck-floor guard). |

### Nits → backlog
Add ShopScreen chooser-input unit tests; consider a confirm step for the paid destructive removal.
