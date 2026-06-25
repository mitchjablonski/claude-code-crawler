import { Box, Text, useApp, useInput } from 'ink';
import type { RunState } from '../../engine/types.js';
import { theme } from '../theme.js';
import { Screen } from '../components/Screen.js';

export function GameOverScreen({
  state,
  relicNames,
  onNew,
  onTitle,
  dailyDate,
  dailyScore,
}: {
  readonly state: RunState;
  /**
   * Held relics by display name (christened epithet preferred over base name),
   * computed in App to mirror the StatusBar relic pattern (#21). Empty => "none".
   */
  readonly relicNames: readonly string[];
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

  // Depth reached: how far into the map this run got. The boss sits on the
  // deepest row, so its row is the run's full length.
  const depth = state.map.nodes[state.currentNodeId]?.row ?? 0;
  const bossRow = state.map.nodes[state.map.bossId]?.row ?? depth;
  const relics = relicNames.length > 0 ? relicNames.join(', ') : 'none';

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
      <Box marginTop={1} flexDirection="column">
        <Text>
          <Text color={theme.colors.muted}>Depth reached </Text>
          <Text color={theme.colors.accent}>
            {depth}/{bossRow}
          </Text>
        </Text>
        <Text>
          <Text color={theme.colors.muted}>Final HP </Text>
          <Text color={theme.colors.hp}>
            {state.hp}/{state.maxHp}
          </Text>
        </Text>
        <Text>
          <Text color={theme.colors.muted}>Deck </Text>
          <Text>{state.deck.length} cards</Text>
          <Text color={theme.colors.muted}>   Gold </Text>
          <Text color={theme.colors.gold}>{state.gold}g</Text>
        </Text>
        <Text>
          <Text color={theme.colors.muted}>Relics </Text>
          <Text color={theme.colors.accent}>{relics}</Text>
        </Text>
        <Text>
          <Text color={theme.colors.muted}>Seed </Text>
          <Text>{state.seed}</Text>
        </Text>
      </Box>
    </Screen>
  );
}
