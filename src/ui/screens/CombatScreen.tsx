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
import type { Effect } from '../../engine/types.js';
import type { IntentKind } from '../theme.js';
import { theme, statusSegments, hpBarSegments, POTION_KEYS } from '../theme.js';
import { CardTile } from '../components/CardTile.js';
import { Screen } from '../components/Screen.js';
import { resolveEnemyMove } from '../../engine/enemyMoves.js';

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
  // Use the SAME resolver the combat reducer uses so the telegraph reflects the
  // enemy's CURRENT phase (it switches the instant the boss crosses a threshold).
  const move = def && resolveEnemyMove(def, enemy);
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

/**
 * Categorize the enemy's NEXT move into a semantic intent purely from its
 * effects, so the UI can show a category icon + color (attack/defend/buff/
 * debuff). Read-only: dealing damage = attack; gaining block = defend;
 * buffing self (strength/dexterity) = buff; applying a negative status to the
 * player = debuff. Attack wins ties so a hybrid move still telegraphs danger.
 */
function intentKindFor(content: ContentRegistry, enemy: EnemyInstance): IntentKind {
  const def = content.enemies[enemy.defId];
  const move = def && resolveEnemyMove(def, enemy);
  if (!move) return 'unknown';
  const fx = move.effects;
  const isBuff = (e: Effect) =>
    e.kind === 'applyStatus' && e.target === 'self';
  const isDebuff = (e: Effect) =>
    e.kind === 'applyStatus' && e.target !== 'self';
  if (fx.some((e) => e.kind === 'damage')) return 'attack';
  if (fx.some((e) => e.kind === 'block')) return 'defend';
  if (fx.some(isBuff)) return 'buff';
  if (fx.some(isDebuff)) return 'debuff';
  return 'unknown';
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

  const footer = pending
    ? 'number: target  esc: cancel'
    : `number: play card  ${state.potions.length > 0 ? 'letter: use potion  ' : ''}e: end turn`;

  return (
    <Screen title="Combat" footer={footer} framed={false}>
      <Box flexDirection="column">
        {combat.enemies.map((enemy, i) => {
          const def = content.enemies[enemy.defId];
          const sigil = def?.sigil ?? '';
          const alive = enemy.hp > 0;
          const bar = hpBarSegments(enemy.hp, enemy.maxHp);
          const kind = intentKindFor(content, enemy);
          return (
            <Box key={`${enemy.defId}-${i}`} flexDirection="column">
              {/* Header: marker, sigil, name, numeric HP, block, statuses. */}
              <Text dimColor={!alive}>
                {pending && alive ? `[${i + 1}] ` : '    '}
                {sigil ? (
                  <Text color={theme.colors.accent}>{sigil} </Text>
                ) : null}
                <Text bold>{nameFor?.(enemy.defId) ?? enemy.name}</Text>{' '}
                {!alive ? (
                  'slain'
                ) : (
                  <>
                    <Text color={theme.colors.hp}>{enemy.hp}</Text>/{enemy.maxHp}
                    {enemy.block > 0 && (
                      <Text color={theme.colors.block}> +{enemy.block}blk</Text>
                    )}
                  </>
                )}
                <StatusTags statuses={enemy.statuses} />
              </Text>
              {/* Detail row: HP bar + telegraphed intent (icon + name + dmg). */}
              {alive && (
                <Text>
                  {'      '}
                  <Text>[</Text>
                  <Text color={theme.colors.hp}>{bar.filled}</Text>
                  <Text color={theme.colors.hpEmpty}>{bar.empty}</Text>
                  <Text>]</Text>
                  <Text color={theme.colors.intent[kind]}>
                    {'  '}next: {theme.intentIcons[kind]} {intentFor(content, enemy)}
                  </Text>
                </Text>
              )}
            </Box>
          );
        })}
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
    </Screen>
  );
}
