# Increment 86 — Web Client B: shared saves + determinism parity (epic B)

**Branch:** `evo/86-web-b` (stacked on `evo/85-web-a2`) → base `main` · **Commit:** `96b532b`
**Epic:** the Web Client (spec `art_KRfv04wkIA`). The user chose SHARED saves — one progression.

## What it adds
- **`src/persistence/format.ts`** — the pure, browser-safe save format (SAVE_VERSION=12,
  META_VERSION=2, encode/decode/migrate) extracted from `saves.ts`, which now delegates + re-exports.
  Reviewer proved the refactor behavior-preserving: identical public surface, identical quarantine
  triggers, and the new writer's output is **byte-identical** to the old writer's; v11 files still
  quarantine; the original save tests are unchanged and green.
- **`src/persistence/bridge.ts`** — a minimal local API (`/api/run`, `/api/meta`, record, settings)
  routing straight into the REAL SaveStore (no reimplemented serialization), mounted as vite
  middleware in BOTH dev and preview. Fixed routes only (path-traversal probed → 404); `CCC_SAVE_DIR`
  honored; fully local/offline.
- **`web/src/persistence.ts`** — a fetch-backed store mirroring `useGame`'s exact cadence (save on
  new, autosave at `isSafeBoundary`, record+clear on end, stale-retire), Title "Continue your delve",
  settings + unlocks from the shared meta, and a **localStorage fallback** (identical format +
  quarantine + migration, with a visible "local-only saves" note) when no bridge is present.
- **Game-over meta lines** — NEW BEST / unlock lines with the terminal's exact rules.
- **REQ-3 parity test** — one recorded action script (with injected bogus actions) through the REAL
  `useGame` hook vs the web's `stepRun` reducer → deep-equal final states + saved-run trails +
  EngineError-no-op identity (reviewer ran it twice). **Round-trip tests** over the production bridge
  against the real store in temp dirs: web-save→terminal-load and back, records/settings both ways.

## Verification (independently reviewed, sandboxed)
- lint ✅ · typecheck ✅ · **512 root + 104 web tests** ✅ · builds green (279 kB / 79.5 kB gz) ·
  `play-verify` PASS · sandboxed API smoke (real files in temp dir, real save dir untouched) · no
  artifacts committed
- Review — 1 lens, **0 blocking** — PASS-WITH-NITS. Logged (all local-only surface): the parity
  test's autosave mirror hand-codes the boundary rule (the real App is covered by a separate
  isSafeBoundary assertion); bridge 500s echo err.message; no req-abort handler in the middleware.
- Concurrency: last-write-wins by design (both surfaces can write; the store quarantines invalid
  data) — documented in web/README.

## Deferred
Web daily-challenge entry point (daily stays terminal-only for now); Title unlock-roster/daily-best
lines; the nits above.

## Web epic (stacked, merge in order)
A1 (#85) → A2 (#86) → **B shared saves (this)** → C art sub-decision + art pass → D narration.
With B, the web client is FUNCTIONALLY complete: full runs playable in the browser on one shared
progression. Phase C (art) is gated on the authored-vs-generated decision.
