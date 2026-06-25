import { Box, Text, useApp, useInput } from 'ink';
import type { RunState } from '../../engine/types.js';
import { theme } from '../theme.js';
import { Screen } from '../components/Screen.js';

export function GameOverScreen({
  state,
  onNew,
  onTitle,
  dailyDate,
  dailyScore,
}: {
  readonly state: RunState;
  readonly onNew: () => void;
  readonly onTitle: () => void;
  /** E3: set when the finished run was the daily challenge. */
  readonly dailyDate?: string;
  /** E3: this run's daily score (pure derivation), shown prominently. */
  readonly dailyScore?: number;
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
      {dailyDate !== undefined && dailyScore !== undefined && (
        <Box marginTop={1}>
          <Text bold color={theme.colors.accent}>
            Daily {dailyDate} score: {dailyScore}
          </Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text>
          seed {state.seed}  -  deck {state.deck.length} cards  -  {state.gold}g
        </Text>
      </Box>
    </Screen>
  );
}
