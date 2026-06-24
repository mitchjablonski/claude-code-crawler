import { Box, Text } from 'ink';
import type { RunState } from '../../engine/types.js';
import { theme, statusSegments } from '../theme.js';

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
  // The player's own combat statuses, rendered with the SAME canonical glyphs
  // (icon + identity color + format) as enemy tags and intent chips. Only shown
  // in combat and only when the player actually has statuses — additive, so the
  // HUD/narration rows are untouched when there's nothing to show.
  const playerStatusSegs = combat ? statusSegments(combat.playerStatuses) : [];
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
          {playerStatusSegs.length > 0 && (
            <>
              <Text>{'  ['}</Text>
              {playerStatusSegs.map((seg, i) => (
                <Text key={seg.text} color={seg.color}>
                  {i > 0 ? ', ' : ''}
                  {seg.text}
                </Text>
              ))}
              <Text>{']'}</Text>
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
