import { Box, Text, useInput } from 'ink';
import type { ContentRegistry, GameAction, RunState } from '../../engine/types.js';
import { theme } from '../theme.js';
import { CardTile } from '../components/CardTile.js';

export function RewardScreen({
  state,
  content,
  dispatch,
  relicDisplayName,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly dispatch: (action: GameAction) => void;
  readonly relicDisplayName?: string;
}) {
  const reward = state.reward;
  const cards = reward?.cards ?? [];

  useInput((input) => {
    if (input === 's') {
      dispatch({ type: 'skipReward' });
      return;
    }
    const n = Number(input);
    if (Number.isInteger(n) && n >= 1 && n <= cards.length) {
      dispatch({ type: 'pickRewardCard', index: n - 1 });
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color={theme.colors.title}>
        Victory! +{reward?.gold ?? 0}g
      </Text>
      {reward?.relicId !== undefined && (
        <Text color={theme.colors.accent}>
          Relic claimed:{' '}
          {relicDisplayName ?? content.relics[reward.relicId]?.name ?? reward.relicId}
        </Text>
      )}
      {reward?.potionId !== undefined && (
        <Text color={theme.colors.success}>
          Found a potion:{' '}
          {content.potions[reward.potionId]?.name ?? reward.potionId} (added to your satchel)
        </Text>
      )}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Take a card for your deck:</Text>
        <Box flexDirection="row" flexWrap="wrap" width={theme.layout.contentWidth}>
          {cards.map((cardId, i) => {
            const card = content.cards[cardId];
            if (!card) return null;
            return <CardTile key={cardId} marker={`[${i + 1}]`} card={card} />;
          })}
        </Box>
        <Text dimColor>[s] Skip</Text>
      </Box>
    </Box>
  );
}
