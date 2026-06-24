import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { CardType, ContentRegistry, Rarity, RunState } from '../../engine/types.js';
import { theme } from '../theme.js';
import { Screen } from './Screen.js';

/**
 * Read-only overlay listing the player's whole deck outside combat.
 *
 * A deck can run 15-25+ cards, so a bordered CardTile per card would overflow
 * the snapshot canvas (30 rows). Instead this is a COMPACT grouped list:
 * identical card ids collapse to one row with an `xN` count, rows sort by type
 * then rarity then name, and rows flow down two columns so a big deck still fits
 * the 76-col / ~28-row viewport. Upgraded (`-plus`) cards keep the `[+]`
 * affordance. If even the two-column grid overflows, rows paginate ([n]/[p]).
 *
 * Purely presentational: it holds no game actions and dispatches nothing. It is
 * an App-local UI overlay (like the pause overlay), NOT an engine phase.
 */

/** Type sort order matches how a player reasons about a deck: hit, defend, scale. */
const TYPE_ORDER: Readonly<Record<CardType, number>> = { attack: 0, skill: 1, power: 2 };
/** Rarity sort order: cheap/common first, shiny last. */
const RARITY_ORDER: Readonly<Record<Rarity, number>> = {
  starter: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
};

/** Rows per column, and columns per page; 2 columns * 11 rows = 22 entries/page. */
const ROWS_PER_COL = 11;
const COLS = 2;
const PER_PAGE = ROWS_PER_COL * COLS;

interface DeckRow {
  readonly card: { id: string; name: string; cost: number; type: CardType; rarity: Rarity };
  readonly upgraded: boolean;
  readonly count: number;
}

/** Group identical ids, resolve to defs, and sort by type -> rarity -> name. */
function buildRows(state: RunState, content: ContentRegistry): DeckRow[] {
  const counts = new Map<string, number>();
  for (const id of state.deck) counts.set(id, (counts.get(id) ?? 0) + 1);
  const rows: DeckRow[] = [];
  for (const [id, count] of counts) {
    const card = content.cards[id];
    if (!card) continue;
    rows.push({
      card: { id: card.id, name: card.name, cost: card.cost, type: card.type, rarity: card.rarity },
      // Upgraded variants are leaf nodes (no further upgradeTo) whose id ends -plus.
      upgraded: card.upgradeTo === undefined && card.id.endsWith('-plus'),
      count,
    });
  }
  rows.sort(
    (a, b) =>
      TYPE_ORDER[a.card.type] - TYPE_ORDER[b.card.type] ||
      RARITY_ORDER[a.card.rarity] - RARITY_ORDER[b.card.rarity] ||
      a.card.name.localeCompare(b.card.name),
  );
  return rows;
}

/** One compact line: `(cost) Name [+]  type  xN`, rarity-colored name. */
function DeckRowLine({ row }: { readonly row: DeckRow }) {
  return (
    <Box width={37} justifyContent="space-between">
      <Text>
        {'('}
        <Text color={theme.colors.cardCost}>{row.card.cost}</Text>
        {') '}
        <Text color={theme.colors.rarity[row.card.rarity]}>{row.card.name}</Text>
        {row.upgraded && <Text color={theme.colors.success}>{' [+]'}</Text>}
      </Text>
      <Text>
        <Text color={theme.colors.cardType[row.card.type]}>{row.card.type}</Text>
        {row.count > 1 && <Text dimColor>{` x${row.count}`}</Text>}
      </Text>
    </Box>
  );
}

export function DeckView({
  state,
  content,
  onClose,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly onClose: () => void;
}) {
  const rows = buildRows(state, content);
  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const [page, setPage] = useState(0);
  const safePage = Math.min(page, pageCount - 1);

  useInput((input, key) => {
    if (key.escape || input === 'v') {
      onClose();
      return;
    }
    if (input === 'n') setPage((p) => Math.min(p + 1, pageCount - 1));
    else if (input === 'p') setPage((p) => Math.max(p - 1, 0));
  });

  const start = safePage * PER_PAGE;
  const pageRows = rows.slice(start, start + PER_PAGE);
  const columns: DeckRow[][] = [];
  for (let c = 0; c < COLS; c++) {
    columns.push(pageRows.slice(c * ROWS_PER_COL, (c + 1) * ROWS_PER_COL));
  }

  return (
    <Screen
      title={`Your deck (${state.deck.length} cards)`}
      footer={`${pageCount > 1 ? `page ${safePage + 1}/${pageCount}  [n]ext [p]rev  ` : ''}[esc/v] close`}
      framed={false}
    >
      <Box flexDirection="row" width={theme.layout.contentWidth}>
        {columns.map((col, ci) => (
          <Box key={ci} flexDirection="column" marginRight={ci === 0 ? 1 : 0}>
            {col.map((row) => (
              <DeckRowLine key={row.card.id} row={row} />
            ))}
          </Box>
        ))}
      </Box>
    </Screen>
  );
}
