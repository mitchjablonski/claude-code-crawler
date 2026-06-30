import { Box, Text, useInput } from 'ink';
import type { ContentRegistry, GameAction, RunState } from '../../engine/types.js';
import { theme } from '../theme.js';
import { CardTile } from '../components/CardTile.js';
import { Screen } from '../components/Screen.js';

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
  // Auto-granted loot (relic / potion) is a distinct group from the card the
  // player actively CHOOSES; grouping + a uniform section gap separates "what
  // you found" from "what to pick" (matches the shop's marginTop={1} sections).
  const hasLoot = reward?.relicId !== undefined || reward?.potionId !== undefined;

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
    <Screen title={`Victory! +${reward?.gold ?? 0}g`} footer="number: take card  [s] skip" framed={false}>
      {hasLoot && (
        <Box flexDirection="column">
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
        </Box>
      )}
      <Box flexDirection="column" marginTop={hasLoot ? 1 : 0}>
        <Text bold>Take a card for your deck:</Text>
        <Box flexDirection="row" flexWrap="wrap" width={theme.layout.contentWidth}>
          {cards.map((cardId, i) => {
            const card = content.cards[cardId];
            if (!card) return null;
            return <CardTile key={cardId} marker={`[${i + 1}]`} card={card} />;
          })}
        </Box>
      </Box>
    </Screen>
  );
}
