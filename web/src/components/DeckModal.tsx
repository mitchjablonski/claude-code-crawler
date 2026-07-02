/**
 * Read-only deck overlay ([v] on the map AND, #56-style, mid-combat), the web
 * analogue of the terminal's DeckView: purely App-local UI state — the engine
 * has no deck-view phase and no GameAction is dispatched.
 *
 * Map mode groups the whole deck by card id with counts. Combat mode reads the
 * LIVE piles instead and groups by pile (hand -> draw -> discard, same order
 * and pile tags as the terminal), with the pile summary in the title
 * (`draw N | hand N | discard N`); the draw pile is shown unordered so no
 * next-card order leaks. Card names take their rarity color, costs the
 * card-cost token, and each row carries its one-line description.
 */
import type { CardType, ContentRegistry, Rarity, RunState } from '@game/engine/types.js';
import { colors } from '../theme.js';
import { useKeys } from '../useKeys.js';
import * as ui from '../ui.js';
import { mutedText } from '../ui.js';

type Pile = 'hand' | 'draw' | 'discard';
const PILE_ORDER: readonly Pile[] = ['hand', 'draw', 'discard'];
const PILE_COLOR: Readonly<Record<Pile, string>> = {
  hand: colors.success,
  draw: colors.accent,
  discard: colors.muted,
};

/** Player-reasoning sort (same as terminal): type -> rarity -> name. */
const TYPE_ORDER: Readonly<Record<CardType, number>> = { attack: 0, skill: 1, power: 2 };
const RARITY_ORDER: Readonly<Record<Rarity, number>> = {
  starter: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
};

interface Row {
  readonly cardId: string;
  readonly count: number;
  readonly pile?: Pile;
}

function groupIds(ids: readonly string[], pile?: Pile): Row[] {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()].map(([cardId, count]) => ({
    cardId,
    count,
    ...(pile ? { pile } : {}),
  }));
}

function sortRows(rows: Row[], content: ContentRegistry): Row[] {
  return rows.sort((a, b) => {
    const ca = content.cards[a.cardId];
    const cb = content.cards[b.cardId];
    if (!ca || !cb) return a.cardId.localeCompare(b.cardId);
    return (
      TYPE_ORDER[ca.type] - TYPE_ORDER[cb.type] ||
      RARITY_ORDER[ca.rarity] - RARITY_ORDER[cb.rarity] ||
      ca.name.localeCompare(cb.name)
    );
  });
}

export function DeckModal({
  state,
  content,
  onClose,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly onClose: () => void;
}) {
  useKeys((key) => {
    if (key === 'v' || key === 'Escape') onClose();
  });

  const combat = state.phase === 'combat' ? state.combat : null;
  const rows = combat
    ? PILE_ORDER.flatMap((pile) =>
        sortRows(
          groupIds(
            pile === 'hand' ? combat.hand : pile === 'draw' ? combat.drawPile : combat.discardPile,
            pile,
          ),
          content,
        ),
      )
    : sortRows(groupIds(state.deck), content);

  const title = combat
    ? `Your deck: draw ${combat.drawPile.length} | hand ${combat.hand.length} | discard ${combat.discardPile.length}`
    : `Your deck (${state.deck.length} cards)`;

  return (
    <section style={{ ...ui.panel, borderColor: colors.accent }} aria-label="deck">
      <h2 style={ui.heading}>{title}</h2>
      {rows.map(({ cardId, count, pile }) => {
        const card = content.cards[cardId];
        const upgraded = card?.upgradeTo === undefined && cardId.endsWith('-plus');
        const canUpgrade =
          card?.upgradeTo !== undefined && content.cards[card.upgradeTo] !== undefined;
        return (
          <p key={`${pile ?? 'deck'}-${cardId}`} style={{ margin: '0.2rem 0' }}>
            {pile && <span style={{ color: PILE_COLOR[pile] }}>{pile} </span>}
            <span style={{ color: card ? colors.rarity[card.rarity] : undefined }}>
              {card?.name ?? cardId}
            </span>
            {upgraded && <span style={{ color: colors.success }}> [+]</span>}
            {canUpgrade && <span style={{ color: colors.accent }}> ^</span>}
            <span style={mutedText}> x{count}</span>
            {card && (
              <span style={mutedText}>
                {' '}
                — <span style={{ color: colors.cardCost }}>{card.cost} energy</span>,{' '}
                <span style={{ color: colors.cardType[card.type] }}>{card.type}</span> —{' '}
                {card.description}
              </span>
            )}
          </p>
        );
      })}
      <button
        type="button"
        style={{ ...ui.button, marginTop: '0.75rem' }}
        onClick={onClose}
      >
        [v] Close
      </button>
    </section>
  );
}
