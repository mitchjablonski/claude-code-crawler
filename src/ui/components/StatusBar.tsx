import { Box, Text } from 'ink';
import type { RunState } from '../../engine/types.js';
import { theme } from '../theme.js';

export function StatusBar({
  state,
  linked,
  narration,
}: {
  readonly state: RunState;
  readonly linked: boolean;
  readonly narration: string | null;
}) {
  const combat = state.combat;
  const hp = combat ? combat.playerHp : state.hp;
  return (
    <Box flexDirection="column">
      <Box width={theme.layout.contentWidth} paddingX={1} justifyContent="space-between">
        <Text>
          <Text color={theme.colors.hp} bold>
            HP {hp}/{state.maxHp}
          </Text>
          {combat && (
            <>
              <Text color={theme.colors.block}>{'  '}BLK {combat.playerBlock}</Text>
              <Text color={theme.colors.energy}>
                {'  '}EN {combat.energy}/{combat.maxEnergy}
              </Text>
            </>
          )}
        </Text>
        <Text>
          <Text color={theme.colors.gold}>{state.gold}g</Text>
          <Text dimColor>
            {'  '}deck {state.deck.length}
          </Text>
          <Text color={theme.colors.accent}>
            {'  '}pots {state.potions.length}/{state.maxPotions}
          </Text>
        </Text>
      </Box>
      <Box paddingX={1} justifyContent="space-between">
        <Text dimColor wrap="truncate">
          {narration ?? ''}
        </Text>
        <Text dimColor>{linked ? 'dungeon: linked' : 'dungeon: dormant (ccc init)'}</Text>
      </Box>
    </Box>
  );
}
