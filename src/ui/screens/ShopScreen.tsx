import { Box, Text, useInput } from 'ink';
import type { ContentRegistry, GameAction, RunState } from '../../engine/types.js';
import { theme, POTION_KEYS } from '../theme.js';

export function ShopScreen({
  state,
  content,
  dispatch,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly dispatch: (action: GameAction) => void;
}) {
  const stock = state.shop?.stock ?? [];
  const potionStock = state.shop?.potionStock ?? [];
  const potionKeys = POTION_KEYS.slice(0, potionStock.length);
  const slotFree = state.potions.length < state.maxPotions;

  useInput((input) => {
    if (input === 'l') {
      dispatch({ type: 'leaveShop' });
      return;
    }
    const potionIndex = potionKeys.indexOf(input);
    if (potionIndex >= 0) {
      const item = potionStock[potionIndex];
      if (item && !item.sold && slotFree && state.gold >= item.price) {
        dispatch({ type: 'buyPotion', index: potionIndex });
      }
      return;
    }
    const n = Number(input);
    if (!Number.isInteger(n) || n < 1 || n > stock.length) return;
    const item = stock[n - 1];
    if (item && !item.sold && state.gold >= item.price) {
      dispatch({ type: 'buyCard', index: n - 1 });
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>
        A cloaked merchant grins. {'"'}Adventurer prices,{'"'} it says, of the markup.
      </Text>
      <Box marginTop={1} flexDirection="column">
        {stock.map((item, i) => {
          const card = content.cards[item.cardId];
          if (!card) return null;
          const buyable = !item.sold && state.gold >= item.price;
          return (
            <Text key={`${item.cardId}-${i}`} dimColor={!buyable}>
              [{i + 1}] {card.name} - {card.description}{' '}
              {item.sold ? (
                '(sold)'
              ) : (
                <Text color={theme.colors.gold}>{item.price}g</Text>
              )}
            </Text>
          );
        })}
      </Box>
      {potionStock.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color={theme.colors.accent}>Potions:</Text>
          {potionStock.map((item, i) => {
            const potion = content.potions[item.potionId];
            if (!potion) return null;
            const buyable = !item.sold && slotFree && state.gold >= item.price;
            return (
              <Text key={`${item.potionId}-${i}`} dimColor={!buyable}>
                ({potionKeys[i] ?? '?'}) {potion.name} - {potion.description}{' '}
                {item.sold ? (
                  '(sold)'
                ) : (
                  <Text color={theme.colors.gold}>{item.price}g</Text>
                )}
              </Text>
            );
          })}
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>number: buy card  letter: buy potion  l: leave</Text>
      </Box>
    </Box>
  );
}
