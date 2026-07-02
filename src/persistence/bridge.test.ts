import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSaveStore, SAVE_VERSION } from './saves.js';
import { handleSaveApi, resolveSaveDir, saveBridgeMiddleware } from './bridge.js';
import { createRun } from '../engine/run.js';
import { DEFAULT_RUN_CONFIG, content } from '../engine/content/index.js';

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-bridge-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const sampleRun = () => createRun(content, 'bridge-test', DEFAULT_RUN_CONFIG);

describe('resolveSaveDir', () => {
  it('honors the CCC_SAVE_DIR env override (same knob as the terminal config)', () => {
    expect(resolveSaveDir({ CCC_SAVE_DIR: '/tmp/elsewhere' }, '/home/me')).toBe('/tmp/elsewhere');
  });

  it('defaults to ~/.claude-code-crawler — the terminal store location', () => {
    expect(resolveSaveDir({}, '/home/me')).toBe(path.join('/home/me', '.claude-code-crawler'));
  });
});

describe('handleSaveApi', () => {
  it('round-trips a run through PUT/GET /api/run against the REAL file store', () => {
    const store = createSaveStore(dir, () => 42);
    const state = sampleRun();
    expect(handleSaveApi(store, 'PUT', '/api/run', { state })).toEqual({
      status: 200,
      body: { ok: true },
    });
    // The file on disk is the terminal's exact format (delegation, not a fork).
    const raw = JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8')) as {
      version: number;
    };
    expect(raw.version).toBe(SAVE_VERSION);
    const res = handleSaveApi(store, 'GET', '/api/run', null)!;
    expect(res.status).toBe(200);
    expect((res.body as { run: { state: unknown; savedAt: number } }).run.state).toEqual(state);
  });

  it('DELETE /api/run clears the save; GET then reports null', () => {
    const store = createSaveStore(dir);
    store.saveRun(sampleRun());
    expect(handleSaveApi(store, 'DELETE', '/api/run', null)!.status).toBe(200);
    expect(handleSaveApi(store, 'GET', '/api/run', null)!.body).toEqual({ run: null });
  });

  it('GET /api/meta + POST record + PUT settings drive the real meta file', () => {
    const store = createSaveStore(dir);
    const record = { seed: 's', outcome: 'victory', endedAt: '2026-06-27T00:00:00Z', score: 7 };
    expect(handleSaveApi(store, 'POST', '/api/meta/record', record)!.status).toBe(200);
    expect(handleSaveApi(store, 'PUT', '/api/meta/settings', { difficulty: 'hard' })!.status).toBe(
      200,
    );
    const meta = handleSaveApi(store, 'GET', '/api/meta', null)!.body as {
      runs: unknown[];
      settings: { difficulty: string };
    };
    expect(meta.runs).toEqual([record]);
    expect(meta.settings.difficulty).toBe('hard');
    // …and the terminal store reads the identical progression.
    expect(store.loadMeta().runs).toEqual([record]);
  });

  it('rejects malformed bodies with 400 and unknown API routes with 404', () => {
    const store = createSaveStore(dir);
    expect(handleSaveApi(store, 'PUT', '/api/run', { nope: 1 })!.status).toBe(400);
    expect(handleSaveApi(store, 'POST', '/api/meta/record', { seed: 1 })!.status).toBe(400);
    expect(handleSaveApi(store, 'PUT', '/api/meta/settings', 'zap')!.status).toBe(400);
    expect(handleSaveApi(store, 'GET', '/api/nope', null)!.status).toBe(404);
  });

  it('returns null for non-API paths so static serving falls through', () => {
    const store = createSaveStore(dir);
    expect(handleSaveApi(store, 'GET', '/index.html', null)).toBeNull();
    expect(handleSaveApi(store, 'GET', '/', null)).toBeNull();
  });
});

describe('saveBridgeMiddleware over real HTTP', () => {
  it('serves the API end-to-end: save in, file on disk, load out', async () => {
    const store = createSaveStore(dir);
    const middleware = saveBridgeMiddleware(store);
    const server = http.createServer((req, res) => {
      middleware(req, res, () => {
        res.statusCode = 404;
        res.end('static');
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as { port: number };
    const base = `http://127.0.0.1:${port}`;
    try {
      const state = sampleRun();
      const put = await fetch(`${base}/api/run`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      expect(put.status).toBe(200);
      expect(fs.existsSync(path.join(dir, 'run.json'))).toBe(true);

      const got = (await (await fetch(`${base}/api/run`)).json()) as {
        run: { state: unknown };
      };
      expect(got.run.state).toEqual(state);

      // Invalid JSON body -> 400, not a crash.
      const bad = await fetch(`${base}/api/run`, { method: 'PUT', body: '{oops' });
      expect(bad.status).toBe(400);

      // Non-API path falls through to the next handler (static).
      const fallthrough = await fetch(`${base}/anything.html`);
      expect(await fallthrough.text()).toBe('static');
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });
});
