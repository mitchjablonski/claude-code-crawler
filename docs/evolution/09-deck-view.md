# Increment 09 — V8: Deck view

**Branch:** `evo/09-deck-view` → base `evo/08-rarity-weighting` (stacked)
**Pillar:** V (visual/UX) · **Commits:** `621e7ad` (impl), review-fix commit follows

## What it does
Closes the two gaps D1's review surfaced: you couldn't see your deck, and the
rest-site upgrade chooser capped at 9 cards.

1. **Deck view overlay** — press `v` on the map to open a read-only overlay listing
   the full deck; `esc`/`v` closes. Compact 2-column **grouped** layout
   (`(cost) Name [+] type xN`, sorted type→rarity→name, `xN` for duplicates),
   paginated (`[n]/[p]`) when a deck exceeds the viewport. Implemented as App-local
   UI state (like PauseOverlay) — **no engine phase, no GameAction, dispatches
   nothing** — so the engine stays pure.
2. **Rest upgrade-chooser pagination** — pages of 9 with `[n]/[p]`; page-relative
   hotkeys map back to the real `deckIndex`, so every upgradeable card is reachable
   (the D1 9-cap + off-by-cap is fixed).

## Verification (independently re-run)
- typecheck ✅ · lint ✅ · **182 tests** ✅ (2 new: overlay open shows deck contents/`x5`; `v` and `esc` both close + input isolation)
- `play-verify` **PASS**, screens now include `deck`, `viewedDeck: true` (autoplayer opens/closes the overlay); all prior feature flags still true
- Visually confirmed: starter deck (single page), a 35-card deck (`page 1/2`, nothing clipped/unreachable), and the rest chooser with 14 upgradeables (`page 1/2`, cards 10–14 reachable)

## Review — 3 lenses (no engine change → balance skipped)
| Lens | Verdict | Notes |
| --- | --- | --- |
| Visual / UX | PASS | Compact, readable, pagination works, theme-tokenized; map shows a `[v] view deck` hint. |
| Regression / scope | PASS-WITH-NITS | Diff is `src/ui/**` + dev tooling only; no engine/GameAction/SAVE_VERSION; overlay mounts exclusively with the map so map keys can't leak; page→deckIndex mapping verified (no off-by-one). |
| Design | PASS-WITH-NITS | Fully closes the D1 gap; overlay-as-UI-state is the right call; consistent rarity/`[+]`/pagination language. |

### Findings addressed
1. Removed a duplicate `viewedDeck` key in the autoplay result (harness paste artifact).
2. Rest menu now shows `[u] Upgrade a card (N upgradeable)`.
3. Queued backlog **V9**: card detail/effect text on row-select (the compact list omits descriptions); reach the deck view from more screens than the map.

### Deferred → V9
Card descriptions in the deck view; opening it from reward/shop/rest/combat.
