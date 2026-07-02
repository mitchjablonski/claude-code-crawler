/**
 * Reward screen: the web mirror of the terminal RewardScreen. Auto-granted
 * loot (gold in the title, relic claimed / potion found lines) is grouped
 * apart from the card the player CHOOSES; card choices are tiles. Keys:
 * number = take card, [s] = skip; every tile and the skip are clickable.
 */
import type { ContentRegistry, GameAction, RunState } from '@game/engine/types.js';
import { colors } from '../theme.js';
import { useKeys } from '../useKeys.js';
import * as ui from '../ui.js';
import { mutedText } from '../ui.js';

export function RewardScreen({
  state,
  content,
  dispatch,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly dispatch: (action: GameAction) => void;
}) {
  const reward = state.reward;
  const cards = reward?.cards ?? [];
  const hasLoot = reward?.relicId !== undefined || reward?.potionId !== undefined;

  useKeys((key) => {
    if (key === 's') {
      dispatch({ type: 'skipReward' });
      return;
    }
    const n = Number(key);
    if (Number.isInteger(n) && n >= 1 && n <= cards.length) {
      dispatch({ type: 'pickRewardCard', index: n - 1 });
    }
  });

  return (
    <section style={{ ...ui.panel, borderColor: colors.success }} aria-label="reward">
      <h2 style={ui.heading}>
        Victory! <span style={{ color: colors.gold }}>+{reward?.gold ?? 0}g</span>
      </h2>
      {hasLoot && (
        <div style={{ marginBottom: '0.75rem' }}>
          {reward?.relicId !== undefined && (
            <p style={{ color: colors.accent, margin: '0.15rem 0' }}>
              Relic claimed: {content.relics[reward.relicId]?.name ?? reward.relicId}
            </p>
          )}
          {reward?.potionId !== undefined && (
            <p style={{ color: colors.success, margin: '0.15rem 0' }}>
              Found a potion: {content.potions[reward.potionId]?.name ?? reward.potionId} (added
              to your satchel)
            </p>
          )}
        </div>
      )}
      <p style={{ fontWeight: 700 }}>Take a card for your deck:</p>
      <div role="list" aria-label="card choices">
        {cards.map((cardId, i) => {
          const card = content.cards[cardId];
          if (!card) return null;
          return (
            <button
              key={`${cardId}-${i}`}
              type="button"
              role="listitem"
              style={ui.button}
              onClick={() => dispatch({ type: 'pickRewardCard', index: i })}
            >
              <span style={ui.keyHint}>[{i + 1}]</span>{' '}
              {'('}
              <span style={{ color: colors.cardCost }}>{card.cost}</span>
              {') '}
              <span style={{ color: colors.rarity[card.rarity] }}>{card.name}</span>{' '}
              <span style={{ color: colors.cardType[card.type] }}>{card.type}</span>{' '}
              <span style={mutedText}>{card.description}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        style={{ ...ui.button, marginTop: '0.5rem' }}
        onClick={() => dispatch({ type: 'skipReward' })}
      >
        <span style={ui.keyHint}>[s]</span> Skip
      </button>
      <p style={ui.footer}>number: take card · [s] skip — or click</p>
    </section>
  );
}
