# Increment 30 — Rest before→after upgrade preview (playtest-driven)

**Branch:** `evo/30-rest-preview` → base `evo/29-merge-conflict` (stacked)
**Pillar:** V (UX, V9) · **Commits:** `18c791c` (feature) + `7a41021` (layout fix)

## Why
UX playtest's #1-ranked friction: the rest-site upgrade chooser showed ONLY the upgraded
card, so the upgrade was a blind decision ("upgrading Battered Buckler vs Oath-Keeper is
arbitrary for anyone who hasn't memorized base stats").

## What it does (pure UI)
Each upgrade option now shows `[N] (cost) Name` + a delta line
`was <base effect>  →  now <upgraded effect>` (base muted, arrow accent, upgraded
success) so the improvement is legible at the decision point. Selection, the upgradeable
count, pagination, and `[esc]` are preserved.

## Verification (independently re-run + eyeballed)
- typecheck ✅ · lint ✅ · **302 tests** ✅ (chooser shows base AND upgraded; selection deckIndex; pagination)
- `play-verify` **PASS**, `upgradedCard: true` (autoplayer still upgrades); empty `src/engine/` diff (pure UI)

## Review — caught + fixed a real regression
First review (PASS-WITH-NITS, 0 blocking) flagged a **[major]** layout regression: the
vertical `was→now` stack at PER_PAGE=9 + per-option margins ran ~32–36 rows — and the
starter decks are 9 cards all-upgradeable, so the FIRST rest hit a full page and clipped
the last options + the `[esc]` footer past the 30-row budget. **Fixed** (`7a41021`):
PER_PAGE 9→6, dropped per-option `marginBottom`, corrected the stale doc comment.
**Re-review PASS, 0 blocking** — worst-case full page (with wrapping deltas) now **23 rows**,
footer fully visible.

| Lens | Verdict | Notes |
| --- | --- | --- |
| Scope / visual / correctness | PASS (after fix) | Pure UI; base→upgraded clear; selection/pagination preserved; full page 23 ≤30 rows. |

## Batch ten complete
#28 (best-run), #29 (merge-conflict elite), #30 (rest before→after) — PRs #28/#29/#30.
#29 and #30 were driven by the fresh Sonnet playtests; #29's fix was independently
re-confirmed by the balance playtester's #1 finding.
