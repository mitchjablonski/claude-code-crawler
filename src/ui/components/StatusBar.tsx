import { Box, Text } from 'ink';
import type { RunState } from '../../engine/types.js';

export function StatusBar({ state }: { readonly state: RunState }) {
  const combat = state.combat;
  const hp = combat ? combat.playerHp : state.hp;
  return (
    <Box paddingX={1} justifyContent="space-between">
      <Text>
        <Text color="red" bold>
          HP {hp}/{state.maxHp}
        </Text>
        {combat && (
          <>
            <Text color="cyan">{'  '}BLK {combat.playerBlock}</Text>
            <Text color="magenta">
              {'  '}EN {combat.energy}/{combat.maxEnergy}
            </Text>
          </>
        )}
      </Text>
      <Text>
        <Text color="yellow">{state.gold}g</Text>
        <Text dimColor>
          {'  '}deck {state.deck.length}
        </Text>
      </Text>
    </Box>
  );
}
