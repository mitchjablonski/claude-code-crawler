/**
 * Web app shell. Owns a run through the SAME engine surface the Ink app uses:
 * `createRun(content, seed, config)` to start, `stepRun` (one `applyAction`
 * with the EngineError-is-a-no-op rule, mirroring `useGame.dispatch`) for
 * every move. Phase routing renders the right screen off `RunState.phase`;
 * screens are presentation + dispatch only.
 *
 * Phase B — SHARED SAVES: when a {@link WebSaveStore} is provided (production
 * always passes one; see main.tsx), the shell mirrors the terminal's exact
 * persistence cadence from `useGame`: save at every engine-defined safe
 * boundary, record + clear on victory/defeat (with difficulty/mode/character/
 * score so milestones and personal bests work), Continue-your-delve resume,
 * and settings persisted on every cycle. Unlocks derive from the SAME run
 * history the terminal reads — one progression across both clients.
 */
import { useCallback, useMemo, useState } from 'react';
import { createRun } from '@game/engine/run.js';
import { content, CHARACTERS, CHARACTER_IDS, DEFAULT_CHARACTER } from '@game/engine/content/index.js';
import { isSafeBoundary, type GameAction, type RunState } from '@game/engine/types.js';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DEFAULT_RUN_MODE,
  RUN_MODES,
  type Difficulty,
  type RunMode,
} from '@game/difficulty.js';
import {
  appendRun,
  EMPTY_META,
  type MetaState,
  type RunRecord,
  type SavedRun,
} from '@game/persistence/format.js';
import { deriveUnlocks } from '@game/progression/milestones.js';
import { bestRun, runScore } from '@game/progression/daily.js';
import { runConfigFor, stepRun } from './game.js';
import { seedFromLocation, freshSeed } from './seed.js';
import type { WebSaveStore } from './persistence.js';
import { TitleScreen } from './screens/TitleScreen.js';
import { MapScreen } from './screens/MapScreen.js';
import { CombatScreen } from './screens/CombatScreen.js';
import { RewardScreen } from './screens/RewardScreen.js';
import { ShopScreen } from './screens/ShopScreen.js';
import { RestScreen } from './screens/RestScreen.js';
import { EventScreen } from './screens/EventScreen.js';
import { GameOverScreen } from './screens/GameOverScreen.js';
import { HudStrip } from './components/HudStrip.js';
import { DeckModal } from './components/DeckModal.js';
import * as ui from './ui.js';

function cycle<T>(values: readonly T[], current: T): T {
  return values[(values.indexOf(current) + 1) % values.length] as T;
}

export function App({
  locationSearch,
  initialState = null,
  store = null,
  now = Date.now,
}: {
  /** URL query string (tests inject; defaults to the real location). */
  readonly locationSearch?: string;
  /**
   * Test seam: mount mid-run with an engine-produced state (screens tests
   * render the REAL shell around a state driven to the phase under test).
   * Production never passes it — runs start from the Title.
   */
  readonly initialState?: RunState | null;
  /**
   * The connected save store (shared bridge or localStorage fallback).
   * Production always passes one (main.tsx connects before mounting); null —
   * the test default — plays without persistence, exactly like A2.
   */
  readonly store?: WebSaveStore | null;
  /** Injected clock for save timestamps (persistence boundary only). */
  readonly now?: () => number;
}) {
  const search = locationSearch ?? window.location.search;
  const pinnedSeed = useMemo(() => seedFromLocation(search), [search]);

  // Settings hydrate from persisted meta exactly like the terminal App does
  // (in-game setting, then default); every cycle/select persists back.
  const validClass = (id: string | undefined): string | undefined =>
    id !== undefined && CHARACTERS[id] !== undefined ? id : undefined;
  const settings = store?.initialMeta.settings;
  const [characterId, setCharacterId] = useState<string>(
    () => validClass(settings?.character) ?? DEFAULT_CHARACTER,
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(() =>
    settings?.difficulty !== undefined && DIFFICULTIES.includes(settings.difficulty)
      ? settings.difficulty
      : DEFAULT_DIFFICULTY,
  );
  const [runMode, setRunMode] = useState<RunMode>(() =>
    settings?.runMode !== undefined && RUN_MODES.includes(settings.runMode)
      ? settings.runMode
      : DEFAULT_RUN_MODE,
  );

  // The shell's live mirror of persisted progression: every write goes to the
  // store AND updates the mirror, so unlock derivation / personal bests never
  // need an async read mid-session. (Cross-client writes land on next launch —
  // documented last-write-wins, same as two terminal sessions.)
  const [meta, setMeta] = useState<MetaState>(() => store?.initialMeta ?? EMPTY_META);
  const [savedRun, setSavedRun] = useState<SavedRun | null>(() => store?.initialRun ?? null);
  // Ids that crossed a milestone in the just-finished run — the terminal's
  // GameOver "NEW UNLOCKED" fanfare. Cleared when the next run starts.
  const [justUnlocked, setJustUnlocked] = useState<readonly string[]>([]);
  // #28 mirror: personal best among PRIOR runs, captured at record time.
  // undefined = no persistence / nothing recorded (no best line at all).
  const [priorBest, setPriorBest] = useState<number | null | undefined>(undefined);

  // E2: only EARNED unlockables enter the draft pool (same rule as terminal).
  const unlocked = useMemo(() => [...deriveUnlocks(meta)], [meta]);

  const [state, setState] = useState<RunState | null>(initialState);
  // UI-only overlay, exactly like the terminal App's deck view: no engine phase.
  const [deckOpen, setDeckOpen] = useState(false);

  const dispatch = useCallback(
    (action: GameAction) => {
      if (!state) return;
      const next = stepRun(state, action);
      if (next === state) return; // EngineError no-op — nothing changed
      if (next.phase === 'victory' || next.phase === 'defeat') {
        if (store) {
          // Mirror useGame.dispatch's run-end record: outcome + the resolved
          // difficulty/mode/character for milestone matching + the pure score.
          const record: RunRecord = {
            seed: next.seed,
            outcome: next.phase,
            endedAt: new Date(now()).toISOString(),
            difficulty,
            mode: runMode,
            character: characterId,
            score: runScore(next),
          };
          void store.recordRun(record);
          void store.clearRun();
          // Personal best compares against PRIOR history (meta before append).
          setPriorBest(bestRun(meta, { character: characterId, mode: runMode }));
          const before = deriveUnlocks(meta);
          const after = appendRun(meta, record);
          const fresh = [...deriveUnlocks(after)].filter((id) => !before.has(id));
          if (fresh.length > 0) setJustUnlocked(fresh);
          setMeta(after);
          setSavedRun(null);
        }
      } else if (isSafeBoundary(next) && store) {
        // Autosave cadence: engine-defined safe boundaries, same as the terminal.
        void store.saveRun(next);
        setSavedRun({ state: next, savedAt: now() });
      }
      setState(next);
    },
    [state, store, meta, difficulty, runMode, characterId, now],
  );

  const newRun = useCallback(() => {
    const seed = pinnedSeed ?? freshSeed();
    const fresh = createRun(
      content,
      seed,
      runConfigFor(characterId, difficulty, runMode, unlocked),
    );
    setJustUnlocked([]);
    setPriorBest(undefined);
    if (store) {
      void store.saveRun(fresh);
      setSavedRun({ state: fresh, savedAt: now() });
    }
    setState(fresh);
    setDeckOpen(false);
  }, [pinnedSeed, characterId, difficulty, runMode, unlocked, store, now]);

  const continueRun = useCallback(() => {
    if (!savedRun) return;
    setJustUnlocked([]);
    setPriorBest(undefined);
    setState(savedRun.state);
    setDeckOpen(false);
  }, [savedRun]);

  const quitToTitle = useCallback(() => {
    // The save (if any) survives, exactly like the terminal's quit-to-title.
    setState(null);
    setDeckOpen(false);
  }, []);

  const selectCharacter = useCallback(
    (id: string) => {
      setCharacterId(id);
      if (store) void store.updateSettings({ character: id });
    },
    [store],
  );
  const cycleDifficulty = useCallback(() => {
    setDifficulty((prev) => {
      const next = cycle(DIFFICULTIES, prev);
      if (store) void store.updateSettings({ difficulty: next });
      return next;
    });
  }, [store]);
  const cycleRunMode = useCallback(() => {
    setRunMode((prev) => {
      const next = cycle(RUN_MODES, prev);
      if (store) void store.updateSettings({ runMode: next });
      return next;
    });
  }, [store]);

  if (!state) {
    return (
      <TitleScreen
        characterId={characterId}
        difficulty={difficulty}
        runMode={runMode}
        seedLocked={pinnedSeed}
        hasSave={savedRun !== null}
        localOnlySaves={store !== null && !store.shared}
        onSelectCharacter={selectCharacter}
        onCycleCharacter={() => selectCharacter(cycle(CHARACTER_IDS, characterId))}
        onCycleDifficulty={cycleDifficulty}
        onCycleRunMode={cycleRunMode}
        onNew={newRun}
        onContinue={continueRun}
      />
    );
  }

  const characterName = CHARACTERS[characterId]?.name ?? characterId;
  const over = state.phase === 'victory' || state.phase === 'defeat';
  // The deck overlay opens over the map AND combat (read-only, grouped by
  // pile in combat), mirroring the terminal App's #56 rule.
  const deckVisible = deckOpen && (state.phase === 'map' || state.phase === 'combat');

  // #46 mirror: names of the unlocks this run just earned, for GameOver fanfare.
  const unlockedNames = justUnlocked
    .map((id) => content.cards[id]?.name ?? content.relics[id]?.name ?? id)
    .sort();

  return (
    <div style={ui.page}>
      {!over && <HudStrip state={state} content={content} characterName={characterName} />}
      {deckVisible ? (
        <DeckModal state={state} content={content} onClose={() => setDeckOpen(false)} />
      ) : (
        <>
          {state.phase === 'map' && (
            <MapScreen
              state={state}
              content={content}
              dispatch={dispatch}
              onViewDeck={() => setDeckOpen(true)}
            />
          )}
          {state.phase === 'combat' && (
            <CombatScreen
              state={state}
              content={content}
              dispatch={dispatch}
              onViewDeck={() => setDeckOpen(true)}
            />
          )}
          {state.phase === 'reward' && (
            <RewardScreen state={state} content={content} dispatch={dispatch} />
          )}
          {state.phase === 'shop' && (
            <ShopScreen state={state} content={content} dispatch={dispatch} />
          )}
          {state.phase === 'rest' && (
            <RestScreen state={state} content={content} dispatch={dispatch} />
          )}
          {state.phase === 'event' && (
            <EventScreen state={state} content={content} dispatch={dispatch} />
          )}
          {over && (
            <GameOverScreen
              state={state}
              content={content}
              characterName={characterName}
              onNew={newRun}
              onTitle={quitToTitle}
              priorBest={priorBest}
              unlockedNames={unlockedNames}
            />
          )}
        </>
      )}
    </div>
  );
}
