import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from 'ink';
import { useGame, type GameDeps } from './useGame.js';
import { useEvents } from './useEvents.js';
import { isSafeBoundary } from '../engine/types.js';
import type { SnarkLevel } from '../config.js';
import type { RunSummary } from '../ai/dungeonAi.js';
import { StatusBar } from './components/StatusBar.js';
import { PauseOverlay } from './components/PauseOverlay.js';
import { Title } from './screens/Title.js';
import { MapScreen } from './screens/MapScreen.js';
import { CombatScreen } from './screens/CombatScreen.js';
import { RewardScreen } from './screens/RewardScreen.js';
import { ShopScreen } from './screens/ShopScreen.js';
import { RestScreen } from './screens/RestScreen.js';
import { EventScreen } from './screens/EventScreen.js';
import { GameOverScreen } from './screens/GameOverScreen.js';

export function App({ deps }: { readonly deps: GameDeps }) {
  const game = useGame(deps);
  const [snark, setSnark] = useState<SnarkLevel>(
    () => deps.snarkLevel ?? deps.store.loadMeta().settings?.snarkLevel ?? 1,
  );
  const cycleSnark = useCallback(() => {
    setSnark((prev) => {
      const next = ((prev + 1) % 3) as SnarkLevel;
      deps.store.updateSettings({ snarkLevel: next });
      return next;
    });
  }, [deps.store]);

  // Ref-based getter so useEvents' tailer never re-subscribes on state churn.
  const stateRef = useRef(game.state);
  stateRef.current = game.state;
  const getRunSummary = useCallback((): RunSummary | null => {
    const run = stateRef.current;
    if (!run) return null;
    return {
      hp: run.hp,
      maxHp: run.maxHp,
      gold: run.gold,
      depth: run.map.nodes[run.currentNodeId]?.row ?? 0,
    };
  }, []);

  const events = useEvents({
    eventsDir: deps.eventsDir,
    createSource: deps.createSource,
    now: deps.now,
    snark,
    ai: deps.ai,
    getRunSummary,
  });

  // Bounded modifiers apply only at engine-defined safe boundaries.
  const { state, applyModifiers } = game;
  const { eventTick, takeModifiers } = events;
  useEffect(() => {
    if (!state || !isSafeBoundary(state)) return;
    applyModifiers(takeModifiers());
  }, [eventTick, state, applyModifiers, takeModifiers]);

  if (!game.state) {
    return (
      <Title
        hasSave={game.hasSave}
        snark={snark}
        aiBackend={deps.ai?.backend ?? 'static'}
        onNew={game.newRun}
        onContinue={game.continueRun}
        onCycleSnark={cycleSnark}
      />
    );
  }

  const run = game.state;
  const over = run.phase === 'victory' || run.phase === 'defeat';

  return (
    <Box flexDirection="column">
      {!over && (
        <StatusBar state={run} linked={events.linked} narration={events.narration} />
      )}
      {events.pause && !over ? (
        <PauseOverlay pause={events.pause} snark={snark} onDismiss={events.dismissPause} />
      ) : (
        <>
          {run.phase === 'map' && <MapScreen state={run} dispatch={game.dispatch} />}
          {run.phase === 'combat' && (
            <CombatScreen state={run} content={game.content} dispatch={game.dispatch} />
          )}
          {run.phase === 'reward' && (
            <RewardScreen state={run} content={game.content} dispatch={game.dispatch} />
          )}
          {run.phase === 'shop' && (
            <ShopScreen state={run} content={game.content} dispatch={game.dispatch} />
          )}
          {run.phase === 'rest' && <RestScreen dispatch={game.dispatch} />}
          {run.phase === 'event' && (
            <EventScreen state={run} content={game.content} dispatch={game.dispatch} />
          )}
          {over && (
            <GameOverScreen state={run} onNew={game.newRun} onTitle={game.quitToTitle} />
          )}
        </>
      )}
    </Box>
  );
}
