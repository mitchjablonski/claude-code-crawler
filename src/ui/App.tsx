import { Box } from 'ink';
import { useGame, type GameDeps } from './useGame.js';
import { StatusBar } from './components/StatusBar.js';
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

  if (!game.state) {
    return (
      <Title hasSave={game.hasSave} onNew={game.newRun} onContinue={game.continueRun} />
    );
  }

  const state = game.state;
  const over = state.phase === 'victory' || state.phase === 'defeat';

  return (
    <Box flexDirection="column">
      {!over && <StatusBar state={state} />}
      {state.phase === 'map' && <MapScreen state={state} dispatch={game.dispatch} />}
      {state.phase === 'combat' && (
        <CombatScreen state={state} content={game.content} dispatch={game.dispatch} />
      )}
      {state.phase === 'reward' && (
        <RewardScreen state={state} content={game.content} dispatch={game.dispatch} />
      )}
      {state.phase === 'shop' && (
        <ShopScreen state={state} content={game.content} dispatch={game.dispatch} />
      )}
      {state.phase === 'rest' && <RestScreen dispatch={game.dispatch} />}
      {state.phase === 'event' && (
        <EventScreen state={state} content={game.content} dispatch={game.dispatch} />
      )}
      {over && (
        <GameOverScreen state={state} onNew={game.newRun} onTitle={game.quitToTitle} />
      )}
    </Box>
  );
}
