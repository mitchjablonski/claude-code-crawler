/**
 * Web save store tests — both halves of the shared-saves story:
 *
 * 1) SHARED PATH round-trip (REQ-3 file-compat): the web store driven over the
 *    real bridge routing against the REAL terminal SaveStore (`saves.ts`) in a
 *    temp dir — a save written by the web store loads in the terminal store
 *    and vice versa, same file format/version, same quarantine semantics.
 * 2) FALLBACK: when the API probe fails (static hosting / offline), saves
 *    degrade to localStorage with the same payload shapes and semantics.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSaveStore, type SaveStore } from '@game/persistence/saves.js';
import { handleSaveApi } from '@game/persistence/bridge.js';
import { SAVE_VERSION, META_VERSION } from '@game/persistence/format.js';
import { connectSaveStore, type FetchLike, type StorageLike } from './persistence.js';
import { newRun } from './testkit.js';

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-web-saves-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

/** The production bridge routing as an injectable fetch (no sockets needed). */
function bridgeFetch(store: SaveStore): FetchLike {
  return (input, init) => {
    const pathname = input.split('?')[0] ?? input;
    const body: unknown = init?.body !== undefined ? JSON.parse(init.body) : null;
    const res = handleSaveApi(store, init?.method ?? 'GET', pathname, body);
    if (res === null) return Promise.resolve({ ok: false, json: () => Promise.resolve(null) });
    return Promise.resolve({
      ok: res.status >= 200 && res.status < 300,
      json: () => Promise.resolve(res.body),
    });
  };
}

function mapStorage(): StorageLike & { readonly map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

describe('shared path: web store <-> terminal store round-trip', () => {
  it('a run saved by the web store loads in the terminal store (same file, v12)', async () => {
    const terminal = createSaveStore(dir);
    const web = await connectSaveStore({ fetchFn: bridgeFetch(terminal), now: () => 1000 });
    expect(web.shared).toBe(true);

    const state = newRun('web-b-roundtrip');
    await web.saveRun(state);

    // The very file the terminal reads, in the terminal's exact format.
    const raw = JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8')) as {
      version: number;
    };
    expect(raw.version).toBe(SAVE_VERSION);
    expect(terminal.loadRun()?.state).toEqual(state);
  });

  it('a run saved by the terminal store resumes in the web store', async () => {
    const terminal = createSaveStore(dir, () => 2000);
    const state = newRun('web-b-roundtrip-2');
    terminal.saveRun(state);

    const web = await connectSaveStore({ fetchFn: bridgeFetch(terminal), now: () => 2001 });
    expect(web.shared).toBe(true);
    expect(web.initialRun?.state).toEqual(state);
    expect(web.initialRun?.savedAt).toBe(2000);
  });

  it('web-recorded runs and settings land in the terminal meta (one progression)', async () => {
    const terminal = createSaveStore(dir);
    const web = await connectSaveStore({ fetchFn: bridgeFetch(terminal) });

    await web.recordRun({
      seed: 's1',
      outcome: 'victory',
      endedAt: '2026-06-27T00:00:00.000Z',
      difficulty: 'hard',
      mode: 'single',
      character: 'knight',
      score: 900,
    });
    await web.updateSettings({ difficulty: 'hard', character: 'warlock' });

    const meta = terminal.loadMeta();
    expect(meta.version).toBe(META_VERSION);
    expect(meta.runs).toHaveLength(1);
    expect(meta.runs[0]?.outcome).toBe('victory');
    expect(meta.settings).toEqual({ difficulty: 'hard', character: 'warlock' });

    // …and a fresh web connect sees the terminal-side progression back.
    const again = await connectSaveStore({ fetchFn: bridgeFetch(terminal) });
    expect(again.initialMeta).toEqual(meta);
  });

  it('keeps the terminal quarantine semantics: a mismatched run file is retired, not read', async () => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'run.json'),
      JSON.stringify({ version: SAVE_VERSION - 1, savedAt: 1, state: {} }),
    );
    const terminal = createSaveStore(dir);
    const web = await connectSaveStore({ fetchFn: bridgeFetch(terminal) });
    expect(web.initialRun).toBeNull();
    const files = fs.readdirSync(dir);
    expect(files.some((f) => f.startsWith('run.json.corrupt-'))).toBe(true);
    expect(files).not.toContain('run.json');
  });

  it('retires a stale save as abandoned at connect (REQ-12 mirror)', async () => {
    const terminal = createSaveStore(dir, () => 0);
    const state = newRun('web-b-stale');
    terminal.saveRun(state); // savedAt 0

    const dayAndABit = 25 * 60 * 60 * 1000;
    const web = await connectSaveStore({ fetchFn: bridgeFetch(terminal), now: () => dayAndABit });
    expect(web.initialRun).toBeNull();
    expect(terminal.loadRun()).toBeNull();
    const runs = terminal.loadMeta().runs;
    expect(runs).toHaveLength(1);
    expect(runs[0]?.outcome).toBe('abandoned');
    expect(runs[0]?.seed).toBe(state.seed);
  });
});

describe('fallback: localStorage when the API is unreachable', () => {
  const noNetwork: FetchLike = () => Promise.reject(new TypeError('fetch failed'));

  it('falls back when fetch rejects (offline / file://) and marks itself local-only', async () => {
    const storage = mapStorage();
    const web = await connectSaveStore({ fetchFn: noNetwork, storage, now: () => 5 });
    expect(web.shared).toBe(false);
    expect(web.initialMeta.runs).toEqual([]);
    expect(web.initialRun).toBeNull();
  });

  it('falls back when a static host answers the probe with HTML (SPA fallback)', async () => {
    const spaHost: FetchLike = () =>
      Promise.resolve({ ok: true, json: () => Promise.reject(new SyntaxError('not JSON')) });
    const web = await connectSaveStore({ fetchFn: spaHost, storage: mapStorage() });
    expect(web.shared).toBe(false);
  });

  it('falls back when a static host 404s the API', async () => {
    const notFound: FetchLike = () =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    const web = await connectSaveStore({ fetchFn: notFound, storage: mapStorage() });
    expect(web.shared).toBe(false);
  });

  it('round-trips run + meta through localStorage using the SAME payload shapes', async () => {
    const storage = mapStorage();
    const web = await connectSaveStore({ fetchFn: noNetwork, storage, now: () => 7 });

    const state = newRun('web-b-local');
    await web.saveRun(state);
    const rawRun = JSON.parse(storage.map.get('ccc.run')!) as { version: number; savedAt: number };
    expect(rawRun.version).toBe(SAVE_VERSION); // identical format, different medium
    expect(rawRun.savedAt).toBe(7);

    await web.recordRun({ seed: state.seed, outcome: 'defeat', endedAt: 'x', score: 12 });
    await web.updateSettings({ runMode: 'arc' });

    const again = await connectSaveStore({ fetchFn: noNetwork, storage, now: () => 8 });
    expect(again.initialRun?.state).toEqual(state);
    expect(again.initialMeta.runs).toHaveLength(1);
    expect(again.initialMeta.settings).toEqual({ runMode: 'arc' });
  });

  it('quarantines a version-mismatched local run instead of loading it', async () => {
    const storage = mapStorage();
    storage.setItem('ccc.run', JSON.stringify({ version: 1, savedAt: 1, state: {} }));
    const web = await connectSaveStore({ fetchFn: noNetwork, storage, now: () => 9 });
    expect(web.initialRun).toBeNull();
    expect(storage.map.has('ccc.run')).toBe(false);
    expect([...storage.map.keys()].some((k) => k.startsWith('ccc.run.corrupt-'))).toBe(true);
  });

  it('migrates (never wipes) local meta with an old version but valid runs', async () => {
    const storage = mapStorage();
    storage.setItem(
      'ccc.meta',
      JSON.stringify({
        version: 1,
        runs: [{ seed: 'old', outcome: 'victory', endedAt: 'then' }, { bogus: true }],
      }),
    );
    const web = await connectSaveStore({ fetchFn: noNetwork, storage });
    expect(web.initialMeta.version).toBe(META_VERSION);
    expect(web.initialMeta.runs).toEqual([{ seed: 'old', outcome: 'victory', endedAt: 'then' }]);
  });
});
