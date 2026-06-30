import { describe, expect, it } from 'vitest';

/**
 * #72 targeting-clarity color assertion. Ink/chalk strip ANSI when stdout is not
 * a TTY (the default in tests), so the other CombatScreen tests can only assert
 * visible text. To prove the selectable `[N]` target marker actually renders in
 * the accent color + bold, this file FORCES color on BEFORE chalk is loaded
 * (chalk evaluates color support at import time) and then dynamically imports
 * everything fresh. Each vitest test file has its own module registry, so this
 * does not leak color into the plain-text CombatScreen tests. `createElement` is
 * used instead of JSX so nothing pulls a module in before FORCE_COLOR is set.
 */
process.env.FORCE_COLOR = '1';

const { createElement: h } = await import('react');
const { render } = await import('ink-testing-library');
const { CombatScreen } = await import('./CombatScreen.js');
const { createRun } = await import('../../engine/run.js');
const { DEFAULT_RUN_CONFIG, content } = await import('../../engine/content/index.js');
type RunState = import('../../engine/types.js').RunState;
type CombatState = import('../../engine/types.js').CombatState;
type EnemyInstance = import('../../engine/types.js').EnemyInstance;

function multiCombat(defIds: readonly string[], hand: readonly string[]): RunState {
  const base = createRun(content, 'target-color-test', DEFAULT_RUN_CONFIG);
  const enemies: EnemyInstance[] = defIds.map((defId) => {
    const def = content.enemies[defId]!;
    return {
      defId,
      name: def.name,
      hp: def.hp[1],
      maxHp: def.hp[1],
      block: 0,
      statuses: {},
      nextMoveIndex: 0,
    };
  });
  const combat: CombatState = {
    enemies,
    hand: [...hand],
    drawPile: [],
    discardPile: [],
    energy: 3,
    maxEnergy: 3,
    playerHp: base.hp,
    playerMaxHp: base.maxHp,
    playerBlock: 0,
    playerStatuses: {},
    turn: 1,
    dealt: 0,
    taken: 0,
    slain: 0,
  };
  return { ...base, phase: 'combat', combat };
}

const noop = () => {};
const tick = () => new Promise((r) => setTimeout(r, 25));

describe('CombatScreen target-select marker pop (#72)', () => {
  it('renders the selectable [N] marker in the accent color + bold during target select', async () => {
    // An enemy-target card + two living enemies → playing it enters target-select
    // (it cannot auto-resolve to a single target), turning the `[N]` markers on.
    const enemyCard = Object.values(content.cards).find(
      (c) => c.target === 'enemy' && c.cost <= 3,
    )!;
    const state = multiCombat(['lint-goblin', 'skeleton-intern'], [enemyCard.id]);
    const { lastFrame, stdin } = render(
      h(CombatScreen, { state, content, dispatch: noop }),
    );
    await tick();
    stdin.write('1'); // play the enemy-target card → pending target-select
    await tick();
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Choose a target:'); // confirms target-select mode
    // accent token = cyan (SGR 36) + bold (SGR 1): the `[1]` marker is emphasized
    // (the colors are stripped outside target mode where markers are blank pad).
    expect(frame).toMatch(/\[1m\[36m\[1\]/);
    expect(frame).toMatch(/\[1m\[36m\[2\]/);
  });
});
