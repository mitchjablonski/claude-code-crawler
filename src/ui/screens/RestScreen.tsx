import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ContentRegistry, GameAction, RunState } from '../../engine/types.js';
import { theme } from '../theme.js';
import { CardTile } from '../components/CardTile.js';

/** Heal fraction must match the `rest` reducer in run.ts (state.maxHp * 0.2). */
const HEAL_PCT = 20;

/** Deck cards (with their deck index) that have a valid upgrade target. */
function upgradeable(
  state: RunState,
  content: ContentRegistry,
): { deckIndex: number; cardId: string; upgradeId: string }[] {
  const out: { deckIndex: number; cardId: string; upgradeId: string }[] = [];
  state.deck.forEach((cardId, deckIndex) => {
    const card = content.cards[cardId];
    if (card?.upgradeTo && content.cards[card.upgradeTo]) {
      out.push({ deckIndex, cardId, upgradeId: card.upgradeTo });
    }
  });
  return out;
}

export function RestScreen({
  state,
  content,
  dispatch,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly dispatch: (action: GameAction) => void;
}) {
  // The engine has no rest sub-phase; the rest/upgrade choice lives here only.
  const [view, setView] = useState<'menu' | 'upgrade'>('menu');
  const options = upgradeable(state, content);

  useInput((input, key) => {
    if (view === 'menu') {
      if (input === 'r') dispatch({ type: 'rest' });
      else if (input === 'u' && options.length > 0) setView('upgrade');
      return;
    }
    // upgrade view
    if (key.escape) {
      setView('menu');
      return;
    }
    const n = Number(input);
    // Only the first 9 upgradeable cards are hotkeyed (single-digit keys).
    if (Number.isInteger(n) && n >= 1 && n <= Math.min(9, options.length)) {
      dispatch({ type: 'upgradeCard', deckIndex: options[n - 1]!.deckIndex });
    }
  });

  if (view === 'upgrade') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold>A defensible alcove, warm and quiet.</Text>
        <Text bold color={theme.colors.title}>
          Upgrade a card:
        </Text>
        <Box flexDirection="row" flexWrap="wrap" width={theme.layout.contentWidth}>
          {options.slice(0, 9).map(({ upgradeId }, i) => {
            const upgraded = content.cards[upgradeId];
            if (!upgraded) return null;
            return (
              <CardTile
                key={`${upgradeId}-${i}`}
                marker={`[${i + 1}]`}
                card={upgraded}
                trailing={<Text color={theme.colors.success}>upgraded +</Text>}
              />
            );
          })}
        </Box>
        <Text dimColor>[esc] Back</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>A defensible alcove, warm and quiet.</Text>
      <Text dimColor>Someone has carved {'"'}5 stars, would die here again{'"'} into the wall.</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>[r] Rest (heal {HEAL_PCT}% of max HP)</Text>
        <Text dimColor={options.length === 0}>
          [u] Upgrade a card{options.length === 0 ? ' (none upgradeable)' : ''}
        </Text>
      </Box>
    </Box>
  );
}
