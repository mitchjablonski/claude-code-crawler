/**
 * Enemy-intent telegraph + live-gradient derivations for the web CombatScreen.
 * MIRRORS the terminal `src/ui/screens/CombatScreen.tsx` helpers verbatim
 * (`intentNameFor` / `intentChips` / `intentKindFor` / `liveGradient`) — that
 * module renders through Ink so it cannot be imported into the browser bundle;
 * the DERIVATIONS are the shared contract and are covered by tests here. All
 * pure: they read already-resolved move effects via the SAME resolver the
 * combat reducer uses (`resolveEnemyMove`), plus theme tokens only.
 */
import type {
  CardDef,
  CombatState,
  ContentRegistry,
  Effect,
  EnemyInstance,
} from '@game/engine/types.js';
import { resolveEnemyMove } from '@game/engine/enemyMoves.js';
import type { IntentKind } from '@game/ui/theme.js';
import { colors, statusChipCss, type WebChip } from './theme.js';

/** The move name for an enemy's CURRENT-phase next move. */
export function intentNameFor(content: ContentRegistry, enemy: EnemyInstance): string {
  const def = content.enemies[enemy.defId];
  const move = def && resolveEnemyMove(def, enemy);
  return move ? move.name : '?';
}

/**
 * The FULL telegraph for an enemy's next move as compact chips (same formats
 * as the terminal: `Ndmg`/`NxTdmg` danger, `+Nblk` block, `+Nhp` success, and
 * canonical status chips for buffs/debuffs). gainEnergy/draw omitted (no
 * player-relevant threat), exactly like the terminal.
 */
export function intentChips(content: ContentRegistry, enemy: EnemyInstance): readonly WebChip[] {
  const def = content.enemies[enemy.defId];
  const move = def && resolveEnemyMove(def, enemy);
  if (!move) return [];
  const chips: WebChip[] = [];
  for (const fx of move.effects) {
    switch (fx.kind) {
      case 'damage': {
        const times = fx.times ?? 1;
        const text = times > 1 ? `${fx.amount}x${times}dmg` : `${fx.amount}dmg`;
        chips.push({ text, color: colors.danger });
        break;
      }
      case 'block':
        chips.push({ text: `+${fx.amount}blk`, color: colors.block });
        break;
      case 'heal':
        chips.push({ text: `+${fx.amount}hp`, color: colors.success });
        break;
      case 'applyStatus': {
        const isSelf = fx.target === 'self';
        chips.push(statusChipCss(fx.status, fx.stacks, { sign: isSelf }));
        break;
      }
      default:
        break;
    }
  }
  return chips;
}

/**
 * Categorize the enemy's NEXT move into a semantic intent purely from its
 * effects (attack wins ties, same precedence as the terminal).
 */
export function intentKindFor(content: ContentRegistry, enemy: EnemyInstance): IntentKind {
  const def = content.enemies[enemy.defId];
  const move = def && resolveEnemyMove(def, enemy);
  if (!move) return 'unknown';
  const fx = move.effects;
  const isBuff = (e: Effect) => e.kind === 'applyStatus' && e.target === 'self';
  const isDebuff = (e: Effect) => e.kind === 'applyStatus' && e.target !== 'self';
  if (fx.some((e) => e.kind === 'damage')) return 'attack';
  if (fx.some((e) => e.kind === 'block')) return 'defend';
  if (fx.some(isBuff)) return 'buff';
  if (fx.some(isDebuff)) return 'debuff';
  return 'unknown';
}

/**
 * #65 live effective value of a missing-HP gradient card (`now N dmg`/`blk`),
 * computed from CURRENT combat HP. Mirrors the engine's
 * `floor((maxHp - hp) / divisor)` exactly — display only. Null for cards
 * without a `scaleMissingHp` damage/block effect.
 */
export function liveGradient(card: CardDef, combat: CombatState): string | null {
  for (const e of card.effects) {
    if ((e.kind === 'damage' || e.kind === 'block') && e.scaleMissingHp !== undefined) {
      const bonus = Math.floor((combat.playerMaxHp - combat.playerHp) / e.scaleMissingHp);
      const effective = e.amount + bonus;
      return `now ${effective} ${e.kind === 'damage' ? 'dmg' : 'blk'}`;
    }
  }
  return null;
}
