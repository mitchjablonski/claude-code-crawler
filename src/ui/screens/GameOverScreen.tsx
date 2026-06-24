import { Box, Text, useApp, useInput } from 'ink';
import type { RunState } from '../../engine/types.js';
import { theme } from '../theme.js';
import { Screen } from '../components/Screen.js';

export function GameOverScreen({
  state,
  onNew,
  onTitle,
}: {
  readonly state: RunState;
  readonly onNew: () => void;
  readonly onTitle: () => void;
}) {
  const { exit } = useApp();
  const won = state.phase === 'victory';

  useInput((input) => {
    if (input === 'n') onNew();
    else if (input === 't') onTitle();
    else if (input === 'q') exit();
  });

  return (
    <Screen title={won ? 'Run Complete' : 'Run Ended'} footer="[n] new delve  [t] title  [q] quit">
      <Text bold color={won ? theme.colors.success : theme.colors.danger}>
        {won ? 'THE SCOPE CREEP IS SLAIN' : 'YOU DIED'}
      </Text>
      <Text dimColor>
        {won
          ? 'The dungeon grumbles and starts drafting new requirements.'
          : 'The dungeon thanks you for your engagement.'}
      </Text>
      <Box marginTop={1}>
        <Text>
          seed {state.seed}  -  deck {state.deck.length} cards  -  {state.gold}g
        </Text>
      </Box>
    </Screen>
  );
}
