import { useEffect } from 'react';
import { Box } from 'ink';
import { useGame, type GameDeps } from './useGame.js';
import { useEvents } from './useEvents.js';
import { isSafeBoundary } from '../engine/types.js';
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
  const events = useEvents({
    eventsDir: deps.eventsDir,
    createSource: deps.createSource,
    now: deps.now,
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
      <Title hasSave={game.hasSave} onNew={game.newRun} onContinue={game.continueRun} />
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
        <PauseOverlay pause={events.pause} onDismiss={events.dismissPause} />
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
