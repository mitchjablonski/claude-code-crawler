import fs from 'node:fs';
import path from 'node:path';
import type { RunState } from '../engine/types.js';

const SAVE_VERSION = 1;

export interface RunRecord {
  readonly seed: string;
  readonly outcome: 'victory' | 'defeat' | 'abandoned';
  readonly endedAt: string; // ISO timestamp
}

export interface MetaState {
  readonly version: number;
  readonly runs: readonly RunRecord[];
}

export interface SaveStore {
  loadRun(): RunState | null;
  saveRun(state: RunState): void;
  clearRun(): void;
  loadMeta(): MetaState;
  recordRun(record: RunRecord): void;
}

const EMPTY_META: MetaState = { version: SAVE_VERSION, runs: [] };

export function createSaveStore(saveDir: string): SaveStore {
  const runFile = path.join(saveDir, 'run.json');
  const metaFile = path.join(saveDir, 'meta.json');

  return {
    loadRun(): RunState | null {
      const data = readJson(runFile);
      if (
        data === null ||
        typeof data !== 'object' ||
        (data as { version?: unknown }).version !== SAVE_VERSION ||
        typeof (data as { state?: unknown }).state !== 'object'
      ) {
        if (data !== null) quarantine(runFile);
        return null;
      }
      return (data as { state: RunState }).state;
    },

    saveRun(state: RunState): void {
      writeJsonAtomic(runFile, { version: SAVE_VERSION, state });
    },

    clearRun(): void {
      fs.rmSync(runFile, { force: true });
    },

    loadMeta(): MetaState {
      const data = readJson(metaFile);
      if (
        data === null ||
        typeof data !== 'object' ||
        (data as { version?: unknown }).version !== SAVE_VERSION ||
        !Array.isArray((data as { runs?: unknown }).runs)
      ) {
        if (data !== null) quarantine(metaFile);
        return EMPTY_META;
      }
      return data as MetaState;
    },

    recordRun(record: RunRecord): void {
      const meta = this.loadMeta();
      writeJsonAtomic(metaFile, { ...meta, runs: [...meta.runs, record] });
    },
  };
}

/** Parse a JSON file; on any read/parse failure, quarantine it and return null. */
function readJson(file: string): unknown {
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return null; // missing file is the normal empty state
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    quarantine(file);
    return null;
  }
}

function quarantine(file: string): void {
  try {
    fs.renameSync(file, `${file}.corrupt-${Date.now()}`);
  } catch {
    // Quarantine is best-effort; never let it block a launch.
  }
}

function writeJsonAtomic(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(value));
  fs.renameSync(tmp, file);
}
