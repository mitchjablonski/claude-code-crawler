/**
 * Combat screen: the web mirror of the terminal CombatScreen. Same info, same
 * keybindings, web-native clicks on top:
 *   - number = play that hand card (auto-targets a lone living enemy; multi
 *     enemies enter target-select), or pick a target while selecting
 *   - esc = cancel target-select, letters (a/b/c/d/f/g) = potions,
 *     e = end turn, v = read-only deck overlay
 *   - click: a hand card plays/selects it, an enemy resolves a pending
 *     target, buttons cover end turn / potions / deck.
 * The enemy pack renders through `CombatStage` — the swappable art seam.
 * Presentation + dispatch only: every rule (cost, legality, targeting) stays
 * in the engine reducer; illegal inputs are guarded exactly like the terminal
 * (and EngineError is a no-op in the shell anyway).
 */
import { useState } from 'react';
import type { ContentRegistry, GameAction, RunState } from '@game/engine/types.js';
import { colors, POTION_KEYS } from '../theme.js';
import { liveGradient } from '../intents.js';
import { CombatStage } from '../components/CombatStage.js';
import { useKeys } from '../useKeys.js';
import * as ui from '../ui.js';
import { mutedText } from '../ui.js';

export function CombatScreen({
  state,
  content,
  dispatch,
  onViewDeck,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly dispatch: (action: GameAction) => void;
  readonly onViewDeck: () => void;
}) {
  const combat = state.combat;
  const [pendingCard, setPendingCard] = useState<number | null>(null);
  const [pendingPotion, setPendingPotion] = useState<number | null>(null);
  if (!combat) return null;

  const living = combat.enemies
    .map((enemy, index) => ({ enemy, index }))
    .filter(({ enemy }) => enemy.hp > 0);
  const potionKeys = POTION_KEYS.slice(0, state.maxPotions);
  const pending = pendingCard !== null || pendingPotion !== null;
  // #60 legibility: count hand cards whose cost exceeds current energy (their
  // key presses silently no-op) and surface it in the footer, like the terminal.
  const unplayable = combat.hand.filter(
    (id) => (content.cards[id]?.cost ?? 0) > combat.energy,
  ).length;

  const clearPending = () => {
    setPendingCard(null);
    setPendingPotion(null);
  };

  const endTurn = () => {
    clearPending();
    dispatch({ type: 'endTurn' });
  };

  /** Play a hand card (or enter target-select) — the card-key/card-click path. */
  const playCard = (handIndex: number) => {
    const cardId = combat.hand[handIndex];
    if (cardId === undefined) return;
    const card = content.cards[cardId];
    if (!card || card.cost > combat.energy) return;
    if (card.target === 'enemy') {
      if (living.length === 1) {
        clearPending();
        dispatch({ type: 'playCard', handIndex, targetIndex: living[0]?.index });
      } else {
        setPendingPotion(null);
        setPendingCard(handIndex);
      }
    } else {
      clearPending();
      dispatch({ type: 'playCard', handIndex });
    }
  };

  /** Use a potion (or enter target-select) — the letter-key/potion-click path. */
  const usePotion = (potionIndex: number) => {
    const potionId = state.potions[potionIndex];
    if (potionId === undefined) return;
    const potion = content.potions[potionId];
    if (!potion) return;
    if (potion.target === 'enemy') {
      if (living.length === 1) {
        clearPending();
        dispatch({ type: 'usePotion', potionIndex, targetIndex: living[0]?.index });
      } else {
        setPendingCard(null);
        setPendingPotion(potionIndex);
      }
    } else {
      clearPending();
      dispatch({ type: 'usePotion', potionIndex });
    }
  };

  /** Resolve a pending card/potion onto an enemy — the target-select path. */
  const targetEnemy = (targetIndex: number) => {
    const target = combat.enemies[targetIndex];
    if (!target || target.hp <= 0) return;
    if (pendingPotion !== null) {
      dispatch({ type: 'usePotion', potionIndex: pendingPotion, targetIndex });
      setPendingPotion(null);
      return;
    }
    if (pendingCard !== null) {
      dispatch({ type: 'playCard', handIndex: pendingCard, targetIndex });
      setPendingCard(null);
    }
  };

  useKeys((key) => {
    if (key === 'Escape') {
      clearPending();
      return;
    }
    if (key === 'v') {
      onViewDeck();
      return;
    }
    if (key === 'e') {
      endTurn();
      return;
    }
    if (!pending) {
      const potionIndex = potionKeys.indexOf(key);
      if (potionIndex >= 0) {
        usePotion(potionIndex);
        return;
      }
    }
    const n = Number(key);
    if (!Number.isInteger(n) || n < 1) return;
    if (pending) {
      targetEnemy(n - 1);
      return;
    }
    playCard(n - 1);
  });

  const footer = pending
    ? '[N] target  esc cancel'
    : `[N] play${unplayable > 0 ? `  ${unplayable} unplayable` : ''}${state.potions.length > 0 ? '  [a-] potion' : ''}  [e] end  [v] deck`;

  return (
    <section style={{ ...ui.panel, borderColor: colors.danger }} aria-label="combat">
      <h2 style={ui.heading}>Combat</h2>
      <CombatStage
        combat={combat}
        content={content}
        targeting={pending}
        onTargetEnemy={targetEnemy}
      />
      <div style={{ marginTop: '0.75rem' }}>
        <p style={{ fontWeight: 700, margin: '0 0 0.35rem 0' }}>
          {pending ? 'Choose a target:' : 'Your hand:'}
        </p>
        <div role="list" aria-label="hand">
          {combat.hand.map((cardId, i) => {
            const card = content.cards[cardId];
            if (!card) return null;
            const affordable = card.cost <= combat.energy;
            const plus = card.upgradeTo === undefined && card.id.endsWith('-plus') ? ' [+]' : '';
            const live = liveGradient(card, combat);
            return (
              <button
                key={`${cardId}-${i}`}
                type="button"
                role="listitem"
                aria-disabled={!affordable}
                style={{
                  ...ui.button,
                  marginBottom: '0.25rem',
                  cursor: affordable ? 'pointer' : 'not-allowed',
                }}
                onClick={() => playCard(i)}
              >
                <span style={ui.keyHint}>[{i + 1}]</span>{' '}
                <span style={affordable ? undefined : mutedText}>
                  {'('}
                  <span style={{ color: colors.cardCost }}>{card.cost}</span>
                  {') '}
                  <span style={{ color: affordable ? colors.rarity[card.rarity] : undefined }}>
                    {card.name}
                    {plus}
                  </span>{' '}
                  <span style={{ color: affordable ? colors.cardType[card.type] : undefined }}>
                    {card.type}
                  </span>{' '}
                  <span style={affordable ? mutedText : undefined}>{card.description}</span>
                  {live !== null && (
                    <span style={{ color: colors.heat, fontWeight: 700 }}> {live}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {state.potions.length > 0 && (
        <div style={{ marginTop: '0.5rem' }} aria-label="satchel">
          <span style={{ color: colors.accent, fontWeight: 700 }}>Satchel:</span>{' '}
          {state.potions.map((potionId, i) => {
            const potion = content.potions[potionId];
            const key = potionKeys[i] ?? '?';
            return (
              <button
                key={`${potionId}-${i}`}
                type="button"
                style={{
                  ...ui.button,
                  display: 'inline-block',
                  width: 'auto',
                  marginRight: '0.5rem',
                }}
                onClick={() => {
                  if (!pending) usePotion(i);
                }}
              >
                ({key}) {potion?.name ?? potionId}
              </button>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: '0.5rem' }}>
        <button
          type="button"
          style={{ ...ui.button, display: 'inline-block', width: 'auto' }}
          onClick={endTurn}
        >
          [e] End turn
        </button>
        <button
          type="button"
          style={{ ...ui.button, display: 'inline-block', width: 'auto', marginLeft: '0.5rem' }}
          onClick={onViewDeck}
        >
          [v] Deck
        </button>
        {pending && (
          <button
            type="button"
            style={{ ...ui.button, display: 'inline-block', width: 'auto', marginLeft: '0.5rem' }}
            onClick={clearPending}
          >
            [esc] Cancel
          </button>
        )}
      </div>
      <p style={ui.footer}>{footer}</p>
    </section>
  );
}
