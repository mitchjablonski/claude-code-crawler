import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type {
  CardDef,
  CombatState,
  ContentRegistry,
  EnemyInstance,
  GameAction,
  RunState,
  Statuses,
} from '../../engine/types.js';
import type { Effect } from '../../engine/types.js';
import type { InkColor, IntentKind } from '../theme.js';
import { theme, statusSegments, statusChip, statusBeatChip, hpBarSegments, POTION_KEYS } from '../theme.js';
import { Screen } from '../components/Screen.js';
import { resolveEnemyMove } from '../../engine/enemyMoves.js';
import { usePrevOnChange, enemyBeats, statusBeats, bigHit } from '../juice.js';

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

/** A compact, theme-tokenized telegraph token for one upcoming move effect. */
interface IntentChip {
  readonly text: string;
  readonly color: InkColor;
}

/** The move name for an enemy's CURRENT-phase next move (anchor: `next: <icon> <name>`). */
function intentNameFor(content: ContentRegistry, enemy: EnemyInstance): string {
  const def = content.enemies[enemy.defId];
  // Use the SAME resolver the combat reducer uses so the telegraph reflects the
  // enemy's CURRENT phase (it switches the instant the boss crosses a threshold).
  const move = def && resolveEnemyMove(def, enemy);
  return move ? move.name : '?';
}

/**
 * Build the FULL telegraph for an enemy's next move as compact, theme-tokenized
 * chips so the player can see every effect the single category icon hides:
 *   - damage      -> `Ndmg` (multi-hit `NxT`), danger color (the headline threat)
 *   - block       -> `+Nblk`, block/defend color
 *   - self-buff   -> `<ICON> +N` (e.g. `STR +1`) via the canonical `statusChip`
 *   - debuff      -> `<ICON> N`  (e.g. `VUL 2`) via the canonical `statusChip`
 *   - self-heal   -> `+Nhp`, success color
 * The status chips (buff/debuff) read with the status' IDENTITY color + format
 * (the canonical `statusChip`), so a status looks the SAME here as in the enemy
 * status tags and the player's status line; only the leading category icon and
 * the non-status chips (damage/block/heal) carry threat-axis kind colors.
 * gainEnergy/draw are vanishingly rare for enemies; omitted (no player-relevant
 * threat). Pure: reads already-resolved move effects + only theme tokens.
 */
function intentChips(content: ContentRegistry, enemy: EnemyInstance): readonly IntentChip[] {
  const def = content.enemies[enemy.defId];
  const move = def && resolveEnemyMove(def, enemy);
  if (!move) return [];
  const chips: IntentChip[] = [];
  for (const fx of move.effects) {
    switch (fx.kind) {
      case 'damage': {
        const times = fx.times ?? 1;
        const text = times > 1 ? `${fx.amount}x${times}dmg` : `${fx.amount}dmg`;
        chips.push({ text, color: theme.colors.danger });
        break;
      }
      case 'block':
        chips.push({ text: `+${fx.amount}blk`, color: theme.colors.block });
        break;
      case 'heal':
        chips.push({ text: `+${fx.amount}hp`, color: theme.colors.success });
        break;
      case 'applyStatus': {
        // target 'self' = enemy buffs itself (gains stacks, shown with a +);
        // otherwise the status lands ON the player. Either way the chip uses the
        // CANONICAL status glyph (identity color + format) so it reads identically
        // to the same status in the enemy tags and the player status line.
        const isSelf = fx.target === 'self';
        const chip = statusChip(fx.status, fx.stacks, { sign: isSelf });
        chips.push({ text: chip.text, color: chip.color });
        break;
      }
      // gainEnergy / draw: not a player-facing threat for enemies — omit.
      default:
        break;
    }
  }
  return chips;
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

/**
 * #65 Overclocker legibility: the LIVE effective value of a missing-HP gradient
 * card, computed from the CURRENT combat HP so the player SEES the payoff number
 * rise as they take damage — the static card description only carries the base
 * plus the "+1 per N missing" template and forces mental math. Returns null for
 * cards without a `scaleMissingHp` damage/block effect (so non-gradient cards are
 * untouched). Mirrors the engine's `floor((maxHp - hp) / divisor)` EXACTLY
 * (display only — no effect/amount change). Combat-only: the map/deck view has no
 * live HP context and keeps showing the static text.
 */
function liveGradient(card: CardDef, combat: CombatState): string | null {
  for (const e of card.effects) {
    if ((e.kind === 'damage' || e.kind === 'block') && e.scaleMissingHp !== undefined) {
      const bonus = Math.floor((combat.playerMaxHp - combat.playerHp) / e.scaleMissingHp);
      const effective = e.amount + bonus;
      return `now ${effective} ${e.kind === 'damage' ? 'dmg' : 'blk'}`;
    }
  }
  return null;
}

/** Pad a string to `n` visible columns (no-op if already wide enough). */
function padEnd(s: string, n: number): string {
  const len = [...s].length;
  return len >= n ? s : s + ' '.repeat(n - len);
}

/** Truncate to `n` columns with a trailing ellipsis (graceful, never empty-cuts). */
function truncateText(s: string, n: number): string {
  const chars = [...s];
  if (chars.length <= n) return s;
  return chars.slice(0, Math.max(0, n - 1)).join('') + '…';
}

/** Width of the card-type column (longest of attack/skill/power). */
const TYPE_COL = 6;

/**
 * #74 combat-only compact hand row. A full 5-card hand rendered as bordered
 * `CardTile`s is 3 tile-rows (~18 rows) — a 3-enemy pack + full hand overran the
 * 30-row snapshot budget (~34). The reward and shop screens still use the rich
 * `CardTile` (browsing contexts where space is free), but COMBAT — where the
 * enemies are already terse text rows — renders each hand card as ONE aligned
 * text row, unifying the combat screen's visual language and collapsing the hand
 * to ~6 rows. Every required affordance survives: the `[N]` marker, the cost pip
 * (kept bright even when the row is dimmed for unaffordability), the rarity-tinted
 * NAME (NEVER truncated — the caller sizes `nameWidth` to the longest card in
 * hand), the type, the description (gracefully `…`-truncated to fit ≤76 cols; the
 * full text is always one `[v]` away in the deck view), and the live "now N"
 * missing-HP gradient. Colors route exclusively through theme tokens.
 */
function CompactHandCard({
  marker,
  card,
  dim = false,
  live,
  nameWidth,
}: {
  readonly marker: string;
  readonly card: CardDef;
  readonly dim?: boolean;
  readonly live?: string | null;
  readonly nameWidth: number;
}) {
  const plus =
    card.upgradeTo === undefined && card.id.endsWith('-plus') ? ' [+]' : '';
  const name = card.name + plus;
  const liveStr = live != null && live !== '' ? `  ${live}` : '';
  // Inner content width of the unframed screen, minus the fixed-width columns:
  // marker `[N] ` (4) + `(C) ` cost (4) + name + space + type + 2 gap, then the
  // live annotation is reserved so it always survives. The remainder is the
  // description budget; it stays >= a small floor so a long name never zeroes it.
  const prefix = 4 + 4 + nameWidth + 1 + TYPE_COL + 2;
  const descBudget = Math.max(
    8,
    theme.layout.contentWidth - 2 - prefix - [...liveStr].length,
  );
  return (
    <Text dimColor={dim}>
      <Text color={theme.colors.accent} bold>
        {marker}
      </Text>
      {' ('}
      <Text color={theme.colors.cardCost} dimColor={false}>
        {card.cost}
      </Text>
      {') '}
      <Text color={theme.colors.rarity[card.rarity]}>{padEnd(name, nameWidth)}</Text>{' '}
      <Text color={theme.colors.cardType[card.type]}>{padEnd(card.type, TYPE_COL)}</Text>
      {'  '}
      <Text>{truncateText(card.description, descBudget)}</Text>
      {liveStr !== '' && (
        <Text color={theme.colors.heat} dimColor={dim} bold>
          {liveStr}
        </Text>
      )}
    </Text>
  );
}

export function CombatScreen({
  state,
  content,
  dispatch,
  nameFor,
  onViewDeck,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly dispatch: (action: GameAction) => void;
  readonly nameFor?: (defId: string) => string | undefined;
  /**
   * Opens the read-only deck overlay (#56). App-local UI state, mirroring the
   * map's `[v] view deck`; optional so direct-render tests need not wire it.
   */
  readonly onViewDeck?: () => void;
}) {
  const combat = state.combat as CombatState;
  // V6 juice: diff the combat state the player's LAST action changed to derive
  // transient beats (damage `-N`, slain `DOWN`, block `+Nblk`). The prior combat
  // is held in a ref and only advances when a new action produces a new state
  // object, so a beat PERSISTS until the next action recomputes it (and is
  // snapshot-verifiable). Empty/zero on first combat render (no prior).
  const priorCombat = usePrevOnChange(combat);
  const beats = enemyBeats(priorCombat, combat);
  const [pendingCard, setPendingCard] = useState<number | null>(null);
  const [pendingPotion, setPendingPotion] = useState<number | null>(null);
  const living = combat.enemies
    .map((enemy, index) => ({ enemy, index }))
    .filter(({ enemy }) => enemy.hp > 0);
  // Letter keys address the satchel (shared with the shop; skips 'e' = end turn).
  const potionKeys = POTION_KEYS.slice(0, state.maxPotions);
  const pending = pendingCard !== null || pendingPotion !== null;
  // Legibility (#60): pressing an unaffordable card silently no-ops below, so
  // DERIVE a live count of hand cards whose cost exceeds current energy and
  // surface it in the footer. No new state — recomputed every render from the
  // live hand/energy, so it stays correct as energy is spent or cards drawn.
  const unplayable = combat.hand.filter(
    (id) => (content.cards[id]?.cost ?? 0) > combat.energy,
  ).length;

  useInput((input, key) => {
    if (key.escape) {
      setPendingCard(null);
      setPendingPotion(null);
      return;
    }
    // #56: open the read-only deck overlay. 'v' is not a card/potion/target key,
    // so it never conflicts; opening dispatches nothing (combat state untouched).
    if (input === 'v' && onViewDeck) {
      onViewDeck();
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

  // #74 footer tightened so the worst case (unplayable + potions + view-deck) fits
  // <=76 cols instead of truncating with an ellipsis. Every key affordance stays
  // legible: [N], the potion letters, [e], and [v].
  const footer = pending
    ? '[N] target  esc cancel'
    : `[N] play${unplayable > 0 ? `  ${unplayable} unplayable` : ''}${state.potions.length > 0 ? '  [a-] potion' : ''}  [e] end${onViewDeck ? '  [v] deck' : ''}`;

  return (
    <Screen title="Combat" footer={footer} framed={false}>
      <Box flexDirection="column">
        {combat.enemies.map((enemy, i) => {
          const def = content.enemies[enemy.defId];
          const sigil = def?.sigil ?? '';
          const alive = enemy.hp > 0;
          const bar = hpBarSegments(enemy.hp, enemy.maxHp);
          const kind = intentKindFor(content, enemy);
          const beat = beats[i];
          // V6 status beats: diff this enemy's prior statuses against now to
          // surface a transient `+2VUL`/`-1PSN` next to its tags — a card that
          // lands Vulnerable, or an end-of-turn poison/decay tick. Same
          // prior-vs-current diff as the damage beat (persists until the next
          // action); a null prior (first render / roster swap) yields no beat.
          const priorEnemy =
            priorCombat && priorCombat.enemies.length === combat.enemies.length
              ? priorCombat.enemies[i]
              : undefined;
          const enemyStatusBeats = statusBeats(priorEnemy?.statuses ?? null, enemy.statuses);
          // #72 multi-enemy legibility: a 1-row gap BETWEEN enemy blocks (never
          // after the last — the hand zone's marginTop owns that seam) so each
          // header+detail pair reads as one unit. Gap-between (not after-each)
          // keeps the worst-case (3-enemy) pack inside the 30-row budget.
          const lastEnemy = i === combat.enemies.length - 1;
          return (
            <Box
              key={`${enemy.defId}-${i}`}
              flexDirection="column"
              marginBottom={lastEnemy ? 0 : 1}
            >
              {/* Header: marker, sigil, name, numeric HP, block, statuses. */}
              <Text dimColor={!alive}>
                {/* #72 targeting clarity: in target-select mode the selectable
                    `[N]` marker POPS (accent + bold) so the eye lands on the
                    pickable enemies instantly; otherwise it's blank padding. */}
                {pending && alive ? (
                  <Text color={theme.colors.accent} bold>
                    {`[${i + 1}] `}
                  </Text>
                ) : (
                  '    '
                )}
                {sigil ? (
                  <Text color={theme.colors.accent}>{sigil} </Text>
                ) : null}
                <Text bold>{nameFor?.(enemy.defId) ?? enemy.name}</Text>{' '}
                {!alive ? (
                  // A slain enemy that died THIS action gets an emphasized DOWN
                  // beat (danger color) on top of the dimmed row; one that was
                  // already dead just reads `slain`.
                  beat?.slain ? (
                    <Text color={theme.colors.danger} bold>
                      DOWN
                    </Text>
                  ) : (
                    'slain'
                  )
                ) : (
                  <>
                    <Text color={theme.colors.hp}>{enemy.hp}</Text>/{enemy.maxHp}
                    {enemy.block > 0 && (
                      <Text color={theme.colors.block}> +{enemy.block}blk</Text>
                    )}
                    {/* Damage DELTA from the last action (persists until next).
                        A big hit (>= threshold) earns a punchy `!` so heavy
                        blows READ harder than chip damage — magnitude emphasis
                        derived purely from the size of the delta, no timer. */}
                    {beat && beat.damage > 0 && (
                      <Text color={theme.colors.danger} bold>
                        {' '}
                        -{beat.damage}
                        {bigHit(beat.damage) ? '!' : ''}
                      </Text>
                    )}
                  </>
                )}
                <StatusTags statuses={enemy.statuses} />
                {/* Status-change beats: `+2VUL` / `-1PSN` in the status' identity
                    color, so a debuff landing (or a poison/decay tick) reads
                    next to the tags it changes. */}
                {enemyStatusBeats.map((sb) => {
                  const chip = statusBeatChip(sb.id, sb.delta);
                  return (
                    <Text key={sb.id} color={chip.color} bold>
                      {' '}
                      {chip.text}
                    </Text>
                  );
                })}
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
                    {'  '}next: {theme.intentIcons[kind]} {intentNameFor(content, enemy)}
                  </Text>
                  {intentChips(content, enemy).map((chip, ci) => (
                    <Text key={`${chip.text}-${ci}`} color={chip.color}>
                      {'  '}
                      {chip.text}
                    </Text>
                  ))}
                </Text>
              )}
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>{pending ? 'Choose a target:' : 'Your hand:'}</Text>
        {(() => {
          // Size the NAME column to the widest card currently in hand (incl. its
          // `[+]` upgrade marker) so names are aligned but NEVER truncated.
          const nameWidth = combat.hand.reduce((w, id) => {
            const c = content.cards[id];
            if (!c) return w;
            const plus =
              c.upgradeTo === undefined && c.id.endsWith('-plus') ? ' [+]' : '';
            return Math.max(w, [...(c.name + plus)].length);
          }, 0);
          return combat.hand.map((cardId, i) => {
            const card = content.cards[cardId];
            if (!card) return null;
            const affordable = card.cost <= combat.energy;
            return (
              <CompactHandCard
                key={`${cardId}-${i}`}
                marker={`[${i + 1}]`}
                card={card}
                dim={!affordable}
                live={liveGradient(card, combat)}
                nameWidth={nameWidth}
              />
            );
          });
        })()}
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
