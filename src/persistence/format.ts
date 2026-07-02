import type { RunState } from '../engine/types.js';

/**
 * PURE save-format core — the single source of truth for what a persisted run
 * or meta payload LOOKS like, shared by every save surface:
 *
 *   - the terminal's file-based store (`saves.ts`, node:fs) — behavior there is
 *     byte-identical to before this extraction; it just delegates here,
 *   - the local save-bridge HTTP API (`bridge.ts`) the web client talks to,
 *   - the web client's localStorage FALLBACK store (`web/src/persistence.ts`),
 *     which must write the exact same shapes so saves stay one format.
 *
 * No Node builtins (browser-importable); no IO — encode/decode/migrate only.
 * Quarantine/atomic-write mechanics stay with each store's medium.
 */

// In-progress RUN saves. Bumped to 9 in #25: RunState gained `stats` (per-run
// cumulative counters) and CombatState gained scoped `dealt`/`taken`/`slain`. A
// v8 in-progress save lacks these, so it quarantines on load — acceptable for a
// transient run (per-run determinism is preserved by storing counters on state).
// META (run history) is versioned and migrated SEPARATELY below so progression
// data is NEVER wiped by this bump.
export const SAVE_VERSION = 12; // v12: MapNode gained eventId (#69 tiered reveal — events decided at gen)

/**
 * Current meta (progression) schema version. Decoupled from SAVE_VERSION so an
 * in-progress-run shape change never threatens the precious run history. Bump
 * this ONLY for a meta-shape change, and migrate in `migrateMeta` — never
 * quarantine run records on a version delta.
 */
export const META_VERSION = 2; // v2: RunRecord gained optional difficulty/mode/character

export interface RunRecord {
  readonly seed: string;
  readonly outcome: 'victory' | 'defeat' | 'abandoned';
  readonly endedAt: string; // ISO timestamp
  /** E2: captured at run-end for milestone rules. Absent on pre-E2 records. */
  readonly difficulty?: 'story' | 'normal' | 'hard' | 'nightmare';
  /** E2: 'single' | 'arc'. Absent on pre-E2 records (treated as not-matching). */
  readonly mode?: 'single' | 'arc';
  /** E2: character class id. Absent on pre-E2 records. */
  readonly character?: string;
  /** E3: the daily-challenge date (`YYYY-MM-DD`) this run was the daily for. */
  readonly daily?: string;
  /** E3: the daily score (pure derivation over the final state). */
  readonly score?: number;
}

export interface MetaSettings {
  readonly snarkLevel?: 0 | 1 | 2;
  readonly difficulty?: 'story' | 'normal' | 'hard' | 'nightmare';
  readonly runMode?: 'single' | 'arc';
  readonly character?: string;
}

export interface MetaState {
  readonly version: number;
  readonly runs: readonly RunRecord[];
  readonly settings?: MetaSettings;
}

export interface SavedRun {
  readonly state: RunState;
  readonly savedAt: number;
}

export const EMPTY_META: MetaState = { version: META_VERSION, runs: [] };

/** A run record is valid if it at least carries the always-present core fields. */
export function isRunRecord(v: unknown): v is RunRecord {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as RunRecord).seed === 'string' &&
    typeof (v as RunRecord).outcome === 'string' &&
    typeof (v as RunRecord).endedAt === 'string'
  );
}

/** The persisted run payload: exactly what every store writes for a run save. */
export function encodeSavedRun(state: RunState, savedAt: number): unknown {
  return { version: SAVE_VERSION, savedAt, state };
}

/**
 * Decode a parsed run payload. Returns null for anything unusable — a missing
 * payload, a version mismatch, or a garbled shape. Callers decide whether a
 * non-null-but-invalid payload deserves quarantine (they know the medium).
 */
export function decodeSavedRun(data: unknown): SavedRun | null {
  if (
    data === null ||
    typeof data !== 'object' ||
    (data as { version?: unknown }).version !== SAVE_VERSION ||
    typeof (data as { state?: unknown }).state !== 'object' ||
    typeof (data as { savedAt?: unknown }).savedAt !== 'number'
  ) {
    return null;
  }
  const entry = data as { state: RunState; savedAt: number };
  return { state: entry.state, savedAt: entry.savedAt };
}

/**
 * Migrate a parsed meta payload forward. INVARIANT (E2 #2): run history is
 * precious progression data and MUST survive any version delta. We MIGRATE
 * rather than quarantine: as long as a usable `runs` array is present we keep
 * every valid record (regardless of the stored version), normalize the version
 * forward, and carry settings through. Only a truly unreadable/garbage payload
 * (no runs array) returns null so the caller can quarantine + fall back empty.
 */
export function migrateMeta(data: unknown): MetaState | null {
  if (data === null || typeof data !== 'object' || !Array.isArray((data as { runs?: unknown }).runs)) {
    return null;
  }
  const raw = data as { version?: unknown; runs: unknown[]; settings?: unknown };
  const runs = raw.runs.filter(isRunRecord);
  const settingsOk =
    typeof raw.settings === 'object' && raw.settings !== null && !Array.isArray(raw.settings);
  return {
    version: META_VERSION,
    runs,
    ...(settingsOk ? { settings: raw.settings as MetaSettings } : {}),
  };
}

/** Meta after appending a finished-run record (the one shape every store writes). */
export function appendRun(meta: MetaState, record: RunRecord): MetaState {
  return { ...meta, runs: [...meta.runs, record] };
}

/** Meta after a partial settings update (shallow merge, same as ever). */
export function mergeSettings(meta: MetaState, settings: MetaSettings): MetaState {
  return { ...meta, settings: { ...meta.settings, ...settings } };
}
