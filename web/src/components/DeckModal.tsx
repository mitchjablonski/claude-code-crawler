/**
 * Read-only deck overlay ([v] on the map), the web analogue of the terminal's
 * DeckView: purely App-local UI state — the engine has no deck-view phase and
 * no GameAction is dispatched. Groups the deck by card id with counts; card
 * names take their rarity color, costs the card-cost token.
 */
import type { ContentRegistry, RunState } from '@game/engine/types.js';
import { colors } from '../theme.js';
import { useKeys } from '../useKeys.js';
import * as ui from '../ui.js';
import { mutedText } from '../ui.js';

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

  const counts = new Map<string, number>();
  for (const id of state.deck) counts.set(id, (counts.get(id) ?? 0) + 1);
  const rows = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <section style={{ ...ui.panel, borderColor: colors.accent }} aria-label="deck">
      <h2 style={ui.heading}>Your deck ({state.deck.length} cards)</h2>
      {rows.map(([cardId, count]) => {
        const card = content.cards[cardId];
        return (
          <p key={cardId} style={{ margin: '0.2rem 0' }}>
            <span style={{ color: card ? colors.rarity[card.rarity] : undefined }}>
              {card?.name ?? cardId}
            </span>
            <span style={mutedText}> x{count}</span>
            {card && (
              <span style={mutedText}>
                {' '}
                — <span style={{ color: colors.cardCost }}>{card.cost} energy</span>,{' '}
                <span style={{ color: colors.cardType[card.type] }}>{card.type}</span>
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
