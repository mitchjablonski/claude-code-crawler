import { Box, Text, useInput } from 'ink';
import type { GameAction, MapNode, NodeKind, RunState } from '../../engine/types.js';
import { theme } from '../theme.js';

const KIND_LABEL: Readonly<Record<NodeKind, string>> = {
  start: 'Start',
  combat: 'Combat',
  elite: 'ELITE combat',
  event: 'Unknown event',
  shop: 'Shop',
  rest: 'Rest site',
  boss: 'THE BOSS',
};

export function MapScreen({
  state,
  dispatch,
  onViewDeck,
}: {
  readonly state: RunState;
  readonly dispatch: (action: GameAction) => void;
  /** Opens the read-only deck overlay (App-local UI state; no engine change). */
  readonly onViewDeck: () => void;
}) {
  const node = state.map.nodes[state.currentNodeId];
  const options = (node?.next ?? [])
    .map((id) => state.map.nodes[id])
    .filter((n): n is MapNode => n !== undefined);
  const bossRow = state.map.nodes[state.map.bossId]?.row ?? 0;

  useInput((input) => {
    if (input === 'v') {
      onViewDeck();
      return;
    }
    const n = Number(input);
    if (Number.isInteger(n) && n >= 1 && n <= options.length) {
      dispatch({ type: 'chooseNode', nodeId: (options[n - 1] as MapNode).id });
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text dimColor>
        Depth {node?.row ?? 0}/{bossRow}
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text bold>The passage forks. Choose your path:</Text>
        {options.map((option, i) => (
          <Text key={option.id}>
            [{i + 1}]{' '}
            <Text color={theme.colors.nodeKind[option.kind]}>
              {KIND_LABEL[option.kind]}
            </Text>
          </Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>press a number to descend  [v] view deck</Text>
      </Box>
    </Box>
  );
}
