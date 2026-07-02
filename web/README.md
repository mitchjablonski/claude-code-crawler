# Claude Code Crawler — web client

A browser renderer for the crawler. **One engine, two renderers:** this
workspace imports the pure engine (`../src/engine/**` and its content) and the
data-only theme (`../src/ui/theme.ts`) **directly** — no copies, no forked
gameplay logic. Web components are presentation + dispatch only; every game
decision goes through the same `createRun` / `applyAction` reducer the terminal
Ink app drives.

## Run it

From the repo root (npm workspaces — one `npm ci` installs everything):

```sh
npm ci                # installs root + web
npm run web:dev       # vite dev server (http://localhost:5173)
npm run web:build     # typecheck happens via `npm run typecheck`; builds web/dist
npm run web:serve     # serve the built app locally (vite preview)
```

Or npx-style without global installs:

```sh
npx --yes npm@latest run web:dev   # any npm >= 7 workspace-aware runner works
# equivalently, from web/:  npx vite / npx vite build / npx vite preview
```

Fully offline; no cloud calls.

## Shared saves (phase B)

Terminal and browser are **one progression**: `web:dev` and `web:serve` mount a
tiny local save-bridge API (`GET/PUT/DELETE /api/run`, `GET /api/meta`,
`POST /api/meta/record`, `PUT /api/meta/settings`) that delegates straight to
the terminal's file-based SaveStore (`src/persistence/saves.ts`) — same files,
same `SAVE_VERSION`, same quarantine-on-mismatch, same meta migration. Win a
run in the browser and the terminal Title shows the unlock; save in the
terminal and the browser Title offers "[c] Continue your delve".

- **Save location**: `~/.claude-code-crawler`, or the `CCC_SAVE_DIR` env
  override — the same knob the terminal honors. Sandboxing the bridge is just
  `CCC_SAVE_DIR=/tmp/somewhere npm run web:serve`.
- **Concurrency**: both clients may write the run save. This is deliberately
  **last-write-wins** — no locking. The store already quarantines anything
  unreadable or version-mismatched, and an in-progress run is transient; run
  HISTORY only ever appends. Play one client at a time for sane resumes.
- **Fallback**: if `dist/` is hosted statically (no API), the client degrades
  to localStorage with the identical payload shapes (`src/persistence/format.ts`
  is the shared pure core) and shows a "local-only saves" note on the Title.
- The web shell mirrors the terminal's cadence exactly: autosave at every
  engine-defined safe boundary, record + clear on victory/defeat (score,
  difficulty/mode/class for milestones), settings persisted per cycle, stale
  saves (>24h) retired as `abandoned` at connect.

### Seeded runs

Append `?seed=<anything>` to the URL to pin the next "New delve" to that seed —
the same seed always produces the same run (identical map, fights, loot).
Without the param, a fresh seed is derived at the new-run boundary via
`crypto.getRandomValues` (never `Math.random`), mirroring the terminal's
`run-<time36>-<rand6>` seed shape.

## A1 scope

- **Title**: class select (all four classes), difficulty + mode, New delve.
  Keys: `[k]` class, `[d]` difficulty, `[m]` mode, `[n]` new — or click.
- **Map**: numbered node choices with the terminal's exact labels (named
  events, `??? Unknown event` mysteries, `(event)` / `(risk/reward)` tags),
  HUD strip (HP/gold/depth/deck/potions/class), `[v]` deck overlay.
- Every other phase (combat, shop, rest, ...) renders a labeled "coming in A2"
  placeholder with a back-to-title escape — the run never crashes on any
  engine phase. `PhaseStub` is the swappable stage seam the A2 screens (and a
  later PixiJS/WebGL art stage) drop into.

## The `.js -> .ts` import gotcha (solved)

The shared engine is authored NodeNext-ESM style: TypeScript sources import
each other by their **compiled** path (`./x.js`) even though only `x.ts` exists.
TypeScript resolves this natively; Vite/esbuild need help for files outside the
web root. Two pieces (kept in lockstep):

- `tsconfig.json` — `moduleResolution: "bundler"` + `paths: { "@game/*": ["../src/*"] }`
  so `tsc --noEmit` typechecks `@game/engine/run.js` against `../src/engine/run.ts`.
- `vite.config.ts` — the `ccc:game-js-specifiers-to-ts` pre-resolver plugin maps
  `@game/**/*.js` and the engine's internal relative `./x.js` imports to the real
  `.ts` sources for dev, build, and vitest alike.

## Theme

`src/theme.ts` re-expresses the terminal's semantic tokens as CSS values by
mapping the shared theme through the shared hex palette — same token names
(hp/block/energy/gold/accent/danger/success/muted/heat, plus the
rarity/cardType/nodeKind/intent/status maps), one source of truth.
