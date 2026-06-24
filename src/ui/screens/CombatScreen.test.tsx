import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { CombatScreen } from './CombatScreen.js';
import { createRun } from '../../engine/run.js';
import { DEFAULT_RUN_CONFIG, content } from '../../engine/content/index.js';
import type { CombatState, EnemyInstance, RunState } from '../../engine/types.js';

/** Build a single-enemy combat RunState whose lone enemy is on `nextMoveIndex`. */
function combatWith(defId: string, nextMoveIndex: number): RunState {
  const base = createRun(content, 'intent-test', DEFAULT_RUN_CONFIG);
  const def = content.enemies[defId];
  if (!def) throw new Error(`unknown enemy ${defId}`);
  const enemy: EnemyInstance = {
    defId,
    name: def.name,
    hp: def.hp[1],
    maxHp: def.hp[1],
    block: 0,
    statuses: {},
    nextMoveIndex,
  };
  const combat: CombatState = {
    enemies: [enemy],
    hand: [],
    drawPile: [],
    discardPile: [],
    energy: 3,
    maxEnergy: 3,
    playerHp: base.hp,
    playerMaxHp: base.maxHp,
    playerBlock: 0,
    playerStatuses: {},
    turn: 1,
  };
  return { ...base, phase: 'combat', combat };
}

const noop = () => {};

describe('CombatScreen intent telegraph', () => {
  it('shows BOTH the damage and the debuff chip for a multi-effect move', () => {
    // Lint Goblin move 1 = Style Violation: 9 damage + apply 2 Vulnerable to player.
    const { lastFrame } = render(
      <CombatScreen
        state={combatWith('lint-goblin', 1)}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('next:');
    expect(frame).toContain('Style Violation');
    expect(frame).toContain('9dmg'); // headline threat
    // Canonical status format (V5): identity color + `<ICON> <N>` with a space,
    // unified across enemy tags, player statuses, and intent chips (was `VUL2`).
    expect(frame).toContain('VUL 2'); // the debuff landing on the player
  });

  it('shows a multi-hit damage chip as NxTdmg', () => {
    // Lint Goblin move 0 = Nitpick: 4 damage x2.
    const { lastFrame } = render(
      <CombatScreen
        state={combatWith('lint-goblin', 0)}
        content={content}
        dispatch={noop}
      />,
    );
    expect(lastFrame() ?? '').toContain('4x2dmg');
  });

  it('shows a +Nblk chip for a pure-block move', () => {
    // Skeleton Intern move 1 = Coffee Break: block 6.
    const { lastFrame } = render(
      <CombatScreen
        state={combatWith('skeleton-intern', 1)}
        content={content}
        dispatch={noop}
      />,
    );
    expect(lastFrame() ?? '').toContain('+6blk');
  });

  it('shows a self-buff chip (ICON+N) for a buff move', () => {
    // Lint Goblin move 2 = Refactor Rage: block 8 + gain 1 Strength (self).
    const { lastFrame } = render(
      <CombatScreen
        state={combatWith('lint-goblin', 2)}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('+8blk');
    // Canonical status format (V5): self-buff keeps the `+` sign on the count but
    // now uses the unified `<ICON> +N` glyph (identity color + space), was `STR+1`.
    expect(frame).toContain('STR +1'); // enemy self-buff
  });
});
