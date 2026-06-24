import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type {
  CombatState,
  ContentRegistry,
  EnemyInstance,
  GameAction,
  RunState,
  Statuses,
} from '../../engine/types.js';
import { theme, statusSegments, POTION_KEYS } from '../theme.js';
import { CardTile } from '../components/CardTile.js';

/** Render a statuses map as theme-styled segments wrapped in brackets. */
function StatusTags({ statuses }: { readonly statuses: Statuses }) {
  const segments = statusSegments(statuses);
  if (segments.length === 0) return null;
  return (
    <Text>
      {' ['}
      {segments.map((seg, i) => (
        <Text key={seg.text} color={seg.color}>
          {i > 0 ? ', ' : ''}
          {seg.text}
        </Text>
      ))}
      {']'}
    </Text>
  );
}

function intentFor(content: ContentRegistry, enemy: EnemyInstance): string {
  const def = content.enemies[enemy.defId];
  const move = def?.moves[enemy.nextMoveIndex % (def?.moves.length ?? 1)];
  if (!move) return '?';
  const damage = move.effects
    .flatMap((fx) =>
      fx.kind === 'damage'
        ? [`${fx.amount}${(fx.times ?? 1) > 1 ? `x${fx.times}` : ''}`]
        : [],
    )
    .join('+');
  return damage ? `${move.name} (${damage})` : move.name;
}

export function CombatScreen({
  state,
  content,
  dispatch,
  nameFor,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly dispatch: (action: GameAction) => void;
  readonly nameFor?: (defId: string) => string | undefined;
}) {
  const combat = state.combat as CombatState;
  const [pendingCard, setPendingCard] = useState<number | null>(null);
  const [pendingPotion, setPendingPotion] = useState<number | null>(null);
  const living = combat.enemies
    .map((enemy, index) => ({ enemy, index }))
    .filter(({ enemy }) => enemy.hp > 0);
  // Letter keys address the satchel (shared with the shop; skips 'e' = end turn).
  const potionKeys = POTION_KEYS.slice(0, state.maxPotions);
  const pending = pendingCard !== null || pendingPotion !== null;

  useInput((input, key) => {
    if (key.escape) {
      setPendingCard(null);
      setPendingPotion(null);
      return;
    }
    if (input === 'e') {
      setPendingCard(null);
      setPendingPotion(null);
      dispatch({ type: 'endTurn' });
      return;
    }

    // Potion hotkeys (only when not mid-target-select).
    if (!pending) {
      const potionIndex = potionKeys.indexOf(input);
      if (potionIndex >= 0) {
        const potionId = state.potions[potionIndex];
        if (potionId === undefined) return;
        const potion = content.potions[potionId];
        if (!potion) return;
        if (potion.target === 'enemy') {
          if (living.length === 1) {
            dispatch({ type: 'usePotion', potionIndex, targetIndex: living[0]?.index });
          } else {
            setPendingPotion(potionIndex);
          }
        } else {
          dispatch({ type: 'usePotion', potionIndex });
        }
        return;
      }
    }

    const n = Number(input);
    if (!Number.isInteger(n) || n < 1) return;

    if (pendingPotion !== null) {
      const target = combat.enemies[n - 1];
      if (target && target.hp > 0) {
        dispatch({ type: 'usePotion', potionIndex: pendingPotion, targetIndex: n - 1 });
        setPendingPotion(null);
      }
      return;
    }

    if (pendingCard !== null) {
      const target = combat.enemies[n - 1];
      if (target && target.hp > 0) {
        dispatch({ type: 'playCard', handIndex: pendingCard, targetIndex: n - 1 });
        setPendingCard(null);
      }
      return;
    }

    const handIndex = n - 1;
    const cardId = combat.hand[handIndex];
    if (cardId === undefined) return;
    const card = content.cards[cardId];
    if (!card || card.cost > combat.energy) return;
    if (card.target === 'enemy') {
      if (living.length === 1) {
        dispatch({ type: 'playCard', handIndex, targetIndex: living[0]?.index });
      } else {
        setPendingCard(handIndex);
      }
    } else {
      dispatch({ type: 'playCard', handIndex });
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box flexDirection="column">
        {combat.enemies.map((enemy, i) => (
          <Text key={`${enemy.defId}-${i}`} dimColor={enemy.hp <= 0}>
            {pending && enemy.hp > 0 ? `[${i + 1}] ` : '    '}
            <Text bold>{nameFor?.(enemy.defId) ?? enemy.name}</Text>{' '}
            {enemy.hp <= 0
              ? 'slain'
              : `${enemy.hp}/${enemy.maxHp}${enemy.block > 0 ? ` +${enemy.block}blk` : ''}`}
            {enemy.hp > 0 && (
              <Text color={theme.colors.enemyIntent}>
                {'  '}next: {intentFor(content, enemy)}
              </Text>
            )}
            <StatusTags statuses={enemy.statuses} />
          </Text>
        ))}
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>{pending ? 'Choose a target:' : 'Your hand:'}</Text>
        <Box
          flexDirection="row"
          flexWrap="wrap"
          width={theme.layout.contentWidth}
        >
          {combat.hand.map((cardId, i) => {
            const card = content.cards[cardId];
            if (!card) return null;
            const affordable = card.cost <= combat.energy;
            return (
              <CardTile
                key={`${cardId}-${i}`}
                marker={`[${i + 1}]`}
                card={card}
                dim={!affordable}
              />
            );
          })}
        </Box>
      </Box>
      {state.potions.length > 0 && (
        <Box marginTop={1}>
          <Text>
            <Text color={theme.colors.accent}>Satchel:</Text>
            {state.potions.map((potionId, i) => {
              const potion = content.potions[potionId];
              const key = potionKeys[i] ?? '?';
              return (
                <Text key={`${potionId}-${i}`}>
                  {'  '}({key}) {potion?.name ?? potionId}
                </Text>
              );
            })}
          </Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>
          {pending
            ? 'number: target  esc: cancel'
            : `number: play card  ${state.potions.length > 0 ? 'letter: use potion  ' : ''}e: end turn`}
        </Text>
      </Box>
    </Box>
  );
}
