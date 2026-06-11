import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSaveStore } from './saves.js';
import { createRun } from '../engine/run.js';
import { DEFAULT_RUN_CONFIG, content } from '../engine/content/index.js';

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-saves-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const sampleRun = () => createRun(content, 'save-test', DEFAULT_RUN_CONFIG);

describe('run saves', () => {
  it('roundtrips a run state exactly', () => {
    const store = createSaveStore(dir);
    const state = sampleRun();
    store.saveRun(state);
    expect(store.loadRun()).toEqual(state);
  });

  it('returns null when no save exists, and after clearRun', () => {
    const store = createSaveStore(dir);
    expect(store.loadRun()).toBeNull();
    store.saveRun(sampleRun());
    store.clearRun();
    expect(store.loadRun()).toBeNull();
    store.clearRun(); // idempotent
  });

  it('quarantines unparseable saves and keeps working', () => {
    const store = createSaveStore(dir);
    fs.writeFileSync(path.join(dir, 'run.json'), '{ not json !!!');
    expect(store.loadRun()).toBeNull();
    const entries = fs.readdirSync(dir);
    expect(entries.some((f) => f.startsWith('run.json.corrupt-'))).toBe(true);
    expect(entries).not.toContain('run.json');
    store.saveRun(sampleRun());
    expect(store.loadRun()).not.toBeNull();
  });

  it('quarantines wrong-shaped saves', () => {
    const store = createSaveStore(dir);
    fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ version: 999 }));
    expect(store.loadRun()).toBeNull();
    expect(fs.readdirSync(dir).some((f) => f.startsWith('run.json.corrupt-'))).toBe(true);
  });

  it('leaves no temp files behind', () => {
    const store = createSaveStore(dir);
    store.saveRun(sampleRun());
    expect(fs.readdirSync(dir).filter((f) => f.includes('.tmp-'))).toHaveLength(0);
  });
});

describe('meta progression', () => {
  it('starts empty and appends run records', () => {
    const store = createSaveStore(dir);
    expect(store.loadMeta().runs).toHaveLength(0);
    store.recordRun({ seed: 'a', outcome: 'victory', endedAt: '2026-06-10T00:00:00Z' });
    store.recordRun({ seed: 'b', outcome: 'defeat', endedAt: '2026-06-10T01:00:00Z' });
    const meta = store.loadMeta();
    expect(meta.runs).toHaveLength(2);
    expect(meta.runs[0]?.seed).toBe('a');
    expect(meta.runs[1]?.outcome).toBe('defeat');
  });

  it('quarantines corrupt meta and returns defaults', () => {
    const store = createSaveStore(dir);
    fs.writeFileSync(path.join(dir, 'meta.json'), 'garbage');
    expect(store.loadMeta().runs).toHaveLength(0);
    expect(fs.readdirSync(dir).some((f) => f.startsWith('meta.json.corrupt-'))).toBe(true);
  });

  it('persists settings without clobbering run history', () => {
    const store = createSaveStore(dir);
    store.recordRun({ seed: 'a', outcome: 'victory', endedAt: '2026-06-10T00:00:00Z' });
    store.updateSettings({ snarkLevel: 2 });
    const meta = store.loadMeta();
    expect(meta.settings?.snarkLevel).toBe(2);
    expect(meta.runs).toHaveLength(1);

    store.updateSettings({ snarkLevel: 0 });
    expect(store.loadMeta().settings?.snarkLevel).toBe(0);
  });
});
