/**
 * Web save store (Web epic, phase B): the browser end of SHARED SAVES.
 *
 * PRIMARY PATH — the save bridge: a tiny local API (`/api/run`, `/api/meta`,
 * `/api/meta/record`, `/api/meta/settings`) mounted by `web:dev` and
 * `web:serve` that delegates straight to the terminal's file-based SaveStore.
 * Playing in the browser and in the terminal is ONE progression: same files,
 * same SAVE_VERSION, same quarantine semantics (all enforced server-side by
 * the real store — nothing is reimplemented here).
 *
 * FALLBACK — localStorage: when the API is unreachable (e.g. `dist/` hosted
 * statically), saves degrade gracefully to browser-local storage using the
 * EXACT same payload shapes (the shared pure `format.ts` core), surfaced in
 * the UI as a "local-only saves" note. Same format, different medium — so
 * nothing forks.
 *
 * CONCURRENCY: both clients may write the run save. Deliberately
 * last-write-wins (no locking) — the store quarantines anything unreadable,
 * and an in-progress run is transient by design.
 */
import type { RunState } from '@game/engine/types.js';
import {
  encodeSavedRun,
  decodeSavedRun,
  migrateMeta,
  appendRun,
  mergeSettings,
  EMPTY_META,
  type MetaSettings,
  type MetaState,
  type RunRecord,
  type SavedRun,
} from '@game/persistence/format.js';

/** Minimal structural fetch, so tests can inject a transport without Response. */
export type FetchLike = (
  input: string,
  init?: { readonly method?: string; readonly headers?: Record<string, string>; readonly body?: string },
) => Promise<{ readonly ok: boolean; json(): Promise<unknown> }>;

/** Minimal structural Storage (localStorage in production, a map in tests). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface WebSaveStore {
  /** true = save bridge (shared with the terminal); false = localStorage-only. */
  readonly shared: boolean;
  /** Snapshot taken at connect time; the App shell mirrors changes from there. */
  readonly initialMeta: MetaState;
  readonly initialRun: SavedRun | null;
  saveRun(state: RunState): Promise<void>;
  clearRun(): Promise<void>;
  recordRun(record: RunRecord): Promise<void>;
  updateSettings(settings: MetaSettings): Promise<void>;
}

const RUN_KEY = 'ccc.run';
const META_KEY = 'ccc.meta';

/** Saves older than this retire as 'abandoned' at connect (useGame's REQ-12 mirror). */
const DEFAULT_RUN_TTL_MS = 24 * 60 * 60 * 1000;

export interface ConnectOptions {
  readonly fetchFn?: FetchLike;
  readonly storage?: StorageLike;
  readonly now?: () => number;
  readonly runTtlMs?: number;
}

/**
 * Probe the save bridge and return the shared store, or fall back to the
 * localStorage store when the API is unreachable/garbled (a static host
 * typically answers `/api/meta` with 404 or the SPA's HTML — both fail the
 * probe's JSON/shape validation and land here safely).
 */
export async function connectSaveStore(opts: ConnectOptions = {}): Promise<WebSaveStore> {
  const now = opts.now ?? Date.now;
  const fetchFn: FetchLike | undefined =
    opts.fetchFn ?? (typeof fetch === 'function' ? (fetch.bind(globalThis) as FetchLike) : undefined);
  let store: WebSaveStore | null = fetchFn ? await tryApi(fetchFn) : null;
  if (!store) {
    const storage =
      opts.storage ?? (typeof localStorage === 'object' ? localStorage : memoryStorage());
    store = localSaveStore(storage, now);
  }
  return retireStaleRun(store, now, opts.runTtlMs ?? DEFAULT_RUN_TTL_MS);
}

/**
 * REQ-12 mirror of `useGame`'s launch check: a save older than the TTL retires
 * as an 'abandoned' run record instead of offering a stale Continue.
 */
async function retireStaleRun(
  store: WebSaveStore,
  now: () => number,
  ttlMs: number,
): Promise<WebSaveStore> {
  const saved = store.initialRun;
  if (!saved || now() - saved.savedAt <= ttlMs) return store;
  await store.recordRun({
    seed: saved.state.seed,
    outcome: 'abandoned',
    endedAt: new Date(now()).toISOString(),
  });
  await store.clearRun();
  return { ...store, initialRun: null };
}

async function tryApi(fetchFn: FetchLike): Promise<WebSaveStore | null> {
  let initialMeta: MetaState;
  let initialRun: SavedRun | null;
  try {
    const metaRes = await fetchFn('/api/meta');
    if (!metaRes.ok) return null;
    const meta = migrateMeta(await metaRes.json());
    if (meta === null) return null; // 200 but not a meta payload => not our API
    initialMeta = meta;

    const runRes = await fetchFn('/api/run');
    if (!runRes.ok) return null;
    const body = (await runRes.json()) as { run?: unknown } | null;
    const run = body?.run ?? null;
    initialRun =
      typeof run === 'object' &&
      run !== null &&
      typeof (run as SavedRun).savedAt === 'number' &&
      typeof (run as SavedRun).state === 'object'
        ? (run as SavedRun)
        : null;
  } catch {
    return null;
  }

  // Writes are best-effort (mirror of the terminal's fire-and-forget cadence):
  // a mid-session bridge hiccup must never crash the run in progress.
  const send = async (path: string, method: string, body?: unknown): Promise<void> => {
    try {
      await fetchFn(path, {
        method,
        headers: { 'content-type': 'application/json' },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      // Best-effort; the next safe-boundary save retries naturally.
    }
  };

  return {
    shared: true,
    initialMeta,
    initialRun,
    saveRun: (state) => send('/api/run', 'PUT', { state }),
    clearRun: () => send('/api/run', 'DELETE'),
    recordRun: (record) => send('/api/meta/record', 'POST', record),
    updateSettings: (settings) => send('/api/meta/settings', 'PUT', settings),
  };
}

/**
 * localStorage fallback. Same payloads as the files (via format.ts), same
 * semantics: version-mismatched/garbled run payloads QUARANTINE (moved to a
 * `.corrupt-<ts>` key, never silently deleted); meta MIGRATES, never wiping
 * run history on a version delta.
 */
function localSaveStore(storage: StorageLike, now: () => number): WebSaveStore {
  const readJson = (key: string): unknown => {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      return null;
    }
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      quarantine(key, raw);
      return null;
    }
  };
  const quarantine = (key: string, raw: string): void => {
    try {
      storage.setItem(`${key}.corrupt-${now()}`, raw);
      storage.removeItem(key);
    } catch {
      // Best-effort, like the file store's rename.
    }
  };
  const write = (key: string, value: unknown): void => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full/blocked: saves silently stop, the run keeps playing.
    }
  };
  const loadMeta = (): MetaState => {
    const data = readJson(META_KEY);
    const meta = migrateMeta(data);
    if (meta === null) {
      if (data !== null) quarantine(META_KEY, JSON.stringify(data));
      return EMPTY_META;
    }
    return meta;
  };
  const loadRun = (): SavedRun | null => {
    const data = readJson(RUN_KEY);
    const run = decodeSavedRun(data);
    if (run === null) {
      if (data !== null) quarantine(RUN_KEY, JSON.stringify(data));
      return null;
    }
    return run;
  };

  return {
    shared: false,
    initialMeta: loadMeta(),
    initialRun: loadRun(),
    saveRun: (state) => {
      write(RUN_KEY, encodeSavedRun(state, now()));
      return Promise.resolve();
    },
    clearRun: () => {
      try {
        storage.removeItem(RUN_KEY);
      } catch {
        // Best-effort.
      }
      return Promise.resolve();
    },
    recordRun: (record) => {
      write(META_KEY, appendRun(loadMeta(), record));
      return Promise.resolve();
    },
    updateSettings: (settings) => {
      write(META_KEY, mergeSettings(loadMeta(), settings));
      return Promise.resolve();
    },
  };
}

/** Last-ditch storage when even localStorage is unavailable (nothing persists). */
function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}
