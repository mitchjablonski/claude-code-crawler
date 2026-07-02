import os from 'node:os';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RunState } from '../engine/types.js';
import { isRunRecord, type MetaSettings } from './format.js';
import type { SaveStore } from './saves.js';

/**
 * SAVE BRIDGE (Web epic, phase B): a minimal local HTTP surface over the ONE
 * existing file-based {@link SaveStore}, so the browser client reads/writes THE
 * SAME save files the terminal uses — one progression, two renderers. Nothing
 * here reimplements serialization: every route delegates to the real store
 * (same SAVE_VERSION, same quarantine semantics, same atomic writes).
 *
 * Endpoints (all JSON, fully local/offline):
 *   GET    /api/run           -> { run: SavedRun | null }
 *   PUT    /api/run           <- { state: RunState }        -> { ok: true }
 *   DELETE /api/run           -> { ok: true }
 *   GET    /api/meta          -> MetaState
 *   POST   /api/meta/record   <- RunRecord                  -> { ok: true }
 *   PUT    /api/meta/settings <- MetaSettings (partial)     -> { ok: true }
 *
 * CONCURRENCY: both surfaces may write the run file. This is deliberately
 * last-write-wins — the store already quarantines unreadable/mismatched data,
 * and an in-progress run is transient. No locking.
 *
 * Served identically in dev (`web:dev`, vite middleware) and built mode
 * (`web:serve`, vite preview middleware) via the plugin in `web/vite.config.ts`.
 */

/**
 * Where the shared saves live: `CCC_SAVE_DIR` env override (same env knob
 * `resolveConfig` honors for the terminal), else `~/.claude-code-crawler` —
 * the terminal's default. Point CCC_SAVE_DIR elsewhere to sandbox the bridge.
 */
export function resolveSaveDir(
  env: Readonly<Record<string, string | undefined>> = process.env,
  homedir: string = os.homedir(),
): string {
  return env['CCC_SAVE_DIR'] ?? path.join(homedir, '.claude-code-crawler');
}

export interface ApiResponse {
  readonly status: number;
  readonly body: unknown;
}

/**
 * Pure-over-the-store request router. Returns null for non-`/api/` paths so
 * callers fall through to their static handler. Exported separately from the
 * middleware so tests (including the web round-trip suite) can drive the exact
 * production routing without sockets.
 */
export function handleSaveApi(
  store: SaveStore,
  method: string,
  pathname: string,
  body: unknown,
): ApiResponse | null {
  if (!pathname.startsWith('/api/')) return null;
  const route = `${method.toUpperCase()} ${pathname}`;
  try {
    switch (route) {
      case 'GET /api/run':
        return { status: 200, body: { run: store.loadRun() } };
      case 'PUT /api/run': {
        const state = (body as { state?: unknown } | null)?.state;
        if (typeof state !== 'object' || state === null) {
          return { status: 400, body: { error: 'expected { state: RunState }' } };
        }
        store.saveRun(state as RunState);
        return { status: 200, body: { ok: true } };
      }
      case 'DELETE /api/run':
        store.clearRun();
        return { status: 200, body: { ok: true } };
      case 'GET /api/meta':
        return { status: 200, body: store.loadMeta() };
      case 'POST /api/meta/record': {
        if (!isRunRecord(body)) {
          return { status: 400, body: { error: 'expected a RunRecord' } };
        }
        store.recordRun(body);
        return { status: 200, body: { ok: true } };
      }
      case 'PUT /api/meta/settings': {
        if (typeof body !== 'object' || body === null || Array.isArray(body)) {
          return { status: 400, body: { error: 'expected a settings object' } };
        }
        store.updateSettings(body as MetaSettings);
        return { status: 200, body: { ok: true } };
      }
      default:
        return { status: 404, body: { error: `no such endpoint: ${route}` } };
    }
  } catch (err) {
    return { status: 500, body: { error: (err as Error).message } };
  }
}

/**
 * Connect-style middleware over {@link handleSaveApi} — the shape both vite's
 * dev server and its preview server accept, so `web:dev` and `web:serve` share
 * one code path. Calls `next()` for anything that isn't an API route.
 */
export function saveBridgeMiddleware(store: SaveStore) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    const pathname = (req.url ?? '/').split('?')[0] ?? '/';
    if (!pathname.startsWith('/api/')) {
      next();
      return;
    }
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      let body: unknown = null;
      if (chunks.length > 0) {
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
        } catch {
          res.statusCode = 400;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'invalid JSON body' }));
          return;
        }
      }
      const result = handleSaveApi(store, req.method ?? 'GET', pathname, body) ?? {
        status: 404,
        body: { error: 'not found' },
      };
      res.statusCode = result.status;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(result.body));
    });
  };
}
