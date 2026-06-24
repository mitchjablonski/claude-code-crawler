import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ContentRegistry, GameAction, RunState } from '../../engine/types.js';
import { theme } from '../theme.js';
import { CardTile } from '../components/CardTile.js';

/** Heal fraction must match the `rest` reducer in run.ts (state.maxHp * 0.2). */
const HEAL_PCT = 20;

/** Upgradeable cards per page; single-digit hotkeys cap a page at 9. */
const PER_PAGE = 9;

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
  // Pages of 9 keep every upgradeable card reachable via single-digit hotkeys.
  const [page, setPage] = useState(0);
  const options = upgradeable(state, content);
  const pageCount = Math.max(1, Math.ceil(options.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PER_PAGE;
  const pageOptions = options.slice(start, start + PER_PAGE);

  useInput((input, key) => {
    if (view === 'menu') {
      if (input === 'r') dispatch({ type: 'rest' });
      else if (input === 'u' && options.length > 0) {
        setPage(0);
        setView('upgrade');
      }
      return;
    }
    // upgrade view
    if (key.escape) {
      setView('menu');
      return;
    }
    if (input === 'n') {
      setPage((p) => Math.min(p + 1, pageCount - 1));
      return;
    }
    if (input === 'p') {
      setPage((p) => Math.max(p - 1, 0));
      return;
    }
    const n = Number(input);
    // Single-digit keys select within the current page (page-relative index).
    if (Number.isInteger(n) && n >= 1 && n <= pageOptions.length) {
      dispatch({ type: 'upgradeCard', deckIndex: pageOptions[n - 1]!.deckIndex });
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
          {pageOptions.map(({ upgradeId, deckIndex }, i) => {
            const upgraded = content.cards[upgradeId];
            if (!upgraded) return null;
            return (
              <CardTile key={`${upgradeId}-${deckIndex}`} marker={`[${i + 1}]`} card={upgraded} />
            );
          })}
        </Box>
        <Text dimColor>
          {pageCount > 1 ? `page ${safePage + 1}/${pageCount}  [n]ext [p]rev  ` : ''}
          [esc] Back
        </Text>
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
