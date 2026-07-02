# Increment 84 — Web Client A1: scaffold + playable Title/Map (epic A1)

**Branch:** `evo/84-web-a1` → base `main` · **Commit:** `ea392ef` (+ engines fix) · **Epic:** the
Web Client (deepPairing spec `art_KRfv04wkIA` — a PLAYABLE browser client on the shared engine; the
user's 2026-07-01 comment reversed the pre-v0.1 "no second playable client" call).

## What it adds
- **`web/` workspace** (React + Vite + TS, npm workspaces): root `lint/typecheck/test/build` chain
  the web gates; root vitest include is explicit so suites can't cross-contaminate; one `npm ci`.
- **Zero engine forks:** web imports `src/engine/**` + content DIRECTLY. The one `src/` change is a
  byte-identical code move — pure difficulty knobs → new `src/difficulty.ts` (config.ts imports
  `node:os`, browsers can't), re-exported so all 14 import sites are untouched (reviewer verified:
  same module instance at runtime, `src/engine/` diff = 0 lines).
- **`.js→.ts` resolution:** tsconfig `paths` + a small vite pre-resolver plugin mapping the engine's
  NodeNext `./x.js` specifiers to `.ts` sources — identical across dev/build/vitest.
- **Playable Title + Map:** 4-class select (names/taglines/HP), difficulty/mode cyclers, new delve —
  keys ([k]/[d]/[m]/[n]) AND clicks; Map with the terminal's exact node labels (named events,
  `??? Unknown event` mystery — no-leak test covers ALL hiddenOnMap events), HUD strip, and the `[v]`
  deck overlay. Non-map phases render a safe "Combat — coming in A2" stub (the swappable stage seam).
- **Theme mirror:** `web/src/theme.ts` derives CSS tokens from the terminal theme's shared palette —
  same token names; a key-set-equality test makes drift break loudly.
- **Seeding:** `?seed=` URL param, else `crypto.getRandomValues` at the explicit new-run boundary —
  NO `Math.random` anywhere in web game flow (stricter than the terminal). Determinism tested
  (same seed → same map; byte-identical replay).

## Verification (independently reviewed from a clean `npm ci`)
- lint ✅ · typecheck ✅ · **504 terminal + 28 web tests** ✅ · build ✅ (vite bundle 244 kB / 70 kB gz)
  · `play-verify` PASS · served-app smoke HTTP 200 · no artifacts committed (`git status` clean post-build)
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS. Fixed in-branch: root `engines` bumped
  `>=18` → `>=20.19` (vite 8 floor; CI matrix 20/22 unaffected). Logged (latent, cosmetic): web
  `nodeLabel` omits the terminal's 58-char truncate — browser wraps instead; revisit if event names grow.

## Web epic (stacked, merge in order)
**A1 (this)** → A2 combat + economy/event screens (full run playable) → B shared saves + cross-client
determinism parity → C art sub-decision + art pass → D narration + juice parity.
