/**
 * Web app shell. Owns a run through the SAME engine surface the Ink app uses:
 * `createRun(content, seed, config)` to start, `applyAction(content, state,
 * action)` as the one reducer for every move (mirroring `useGame.dispatch`,
 * including the EngineError-is-a-no-op rule so stray clicks/keys never crash).
 * Phase routing renders the right screen off `RunState.phase`; screens are
 * presentation + dispatch only. A2: every phase has a real screen — a FULL run
 * (single or multi-act arc; act transitions are engine-side map moves) is
 * playable in the browser.
 */
import { useCallback, useMemo, useState } from 'react';
import { applyAction, createRun } from '@game/engine/run.js';
import { content, CHARACTERS, CHARACTER_IDS, DEFAULT_CHARACTER } from '@game/engine/content/index.js';
import { EngineError, type GameAction, type RunState } from '@game/engine/types.js';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DEFAULT_RUN_MODE,
  RUN_MODES,
  type Difficulty,
  type RunMode,
} from '@game/difficulty.js';
import { runConfigFor } from './game.js';
import { seedFromLocation, freshSeed } from './seed.js';
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
}: {
  /** URL query string (tests inject; defaults to the real location). */
  readonly locationSearch?: string;
  /**
   * Test seam: mount mid-run with an engine-produced state (screens tests
   * render the REAL shell around a state driven to the phase under test).
   * Production never passes it — runs start from the Title.
   */
  readonly initialState?: RunState | null;
}) {
  const search = locationSearch ?? window.location.search;
  const pinnedSeed = useMemo(() => seedFromLocation(search), [search]);

  const [characterId, setCharacterId] = useState<string>(DEFAULT_CHARACTER);
  const [difficulty, setDifficulty] = useState<Difficulty>(DEFAULT_DIFFICULTY);
  const [runMode, setRunMode] = useState<RunMode>(DEFAULT_RUN_MODE);
  const [state, setState] = useState<RunState | null>(initialState);
  // UI-only overlay, exactly like the terminal App's deck view: no engine phase.
  const [deckOpen, setDeckOpen] = useState(false);

  const dispatch = useCallback((action: GameAction) => {
    setState((prev) => {
      if (!prev) return prev;
      try {
        return applyAction(content, prev, action);
      } catch (err) {
        // Invalid input for the current state is a no-op, not a crash (same
        // rule as the terminal's useGame.dispatch).
        if (err instanceof EngineError) return prev;
        throw err;
      }
    });
  }, []);

  const newRun = useCallback(() => {
    const seed = pinnedSeed ?? freshSeed();
    setState(createRun(content, seed, runConfigFor(characterId, difficulty, runMode)));
    setDeckOpen(false);
  }, [pinnedSeed, characterId, difficulty, runMode]);

  const quitToTitle = useCallback(() => {
    setState(null);
    setDeckOpen(false);
  }, []);

  if (!state) {
    return (
      <TitleScreen
        characterId={characterId}
        difficulty={difficulty}
        runMode={runMode}
        seedLocked={pinnedSeed}
        onSelectCharacter={setCharacterId}
        onCycleCharacter={() => setCharacterId((c) => cycle(CHARACTER_IDS, c))}
        onCycleDifficulty={() => setDifficulty((d) => cycle(DIFFICULTIES, d))}
        onCycleRunMode={() => setRunMode((m) => cycle(RUN_MODES, m))}
        onNew={newRun}
      />
    );
  }

  const characterName = CHARACTERS[characterId]?.name ?? characterId;
  const over = state.phase === 'victory' || state.phase === 'defeat';
  // The deck overlay opens over the map AND combat (read-only, grouped by
  // pile in combat), mirroring the terminal App's #56 rule.
  const deckVisible = deckOpen && (state.phase === 'map' || state.phase === 'combat');

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
            />
          )}
        </>
      )}
    </div>
  );
}
