import fs from 'node:fs';
import path from 'node:path';
import type { RunState } from '../engine/types.js';
import {
  appendRun,
  decodeSavedRun,
  encodeSavedRun,
  EMPTY_META,
  mergeSettings,
  migrateMeta,
  type MetaSettings,
  type MetaState,
  type RunRecord,
  type SavedRun,
} from './format.js';

/**
 * The terminal's FILE-BASED save store. What a payload looks like (versions,
 * decode/migrate rules, record validity) lives in the pure `format.ts` core —
 * shared with the web save bridge and the web localStorage fallback so every
 * surface reads and writes the exact same shapes. This module owns only the
 * file mechanics: atomic writes and quarantine-on-corruption.
 */

// Re-exported so every existing import site (`from './saves.js'`) keeps working.
export type { MetaSettings, MetaState, RunRecord, SavedRun } from './format.js';
export { SAVE_VERSION, META_VERSION } from './format.js';

export interface SaveStore {
  loadRun(): SavedRun | null;
  saveRun(state: RunState): void;
  clearRun(): void;
  loadMeta(): MetaState;
  recordRun(record: RunRecord): void;
  updateSettings(settings: MetaSettings): void;
}

export function createSaveStore(saveDir: string, now: () => number = Date.now): SaveStore {
  const runFile = path.join(saveDir, 'run.json');
  const metaFile = path.join(saveDir, 'meta.json');

  return {
    loadRun(): SavedRun | null {
      const data = readJson(runFile);
      const run = decodeSavedRun(data);
      if (run === null) {
        // A present-but-unusable payload (bad shape OR version mismatch) is
        // quarantined; a missing file is just the normal empty state.
        if (data !== null) quarantine(runFile);
        return null;
      }
      return run;
    },

    saveRun(state: RunState): void {
      writeJsonAtomic(runFile, encodeSavedRun(state, now()));
    },

    clearRun(): void {
      fs.rmSync(runFile, { force: true });
    },

    loadMeta(): MetaState {
      const data = readJson(metaFile);
      const meta = migrateMeta(data);
      if (meta === null) {
        if (data !== null) quarantine(metaFile);
        return EMPTY_META;
      }
      return meta;
    },

    recordRun(record: RunRecord): void {
      writeJsonAtomic(metaFile, appendRun(this.loadMeta(), record));
    },

    updateSettings(settings: MetaSettings): void {
      writeJsonAtomic(metaFile, mergeSettings(this.loadMeta(), settings));
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
