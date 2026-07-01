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
    dealt: 0,
    taken: 0,
    slain: 0,
  };
  return { ...base, phase: 'combat', combat };
}

/** Same combat with the lone enemy's hp overridden (to simulate a hit/kill). */
function withEnemyHp(state: RunState, hp: number): RunState {
  const combat = state.combat as CombatState;
  const enemy = combat.enemies[0] as EnemyInstance;
  return {
    ...state,
    combat: { ...combat, enemies: [{ ...enemy, hp }] },
  };
}

/** Same combat with the lone enemy patched (hp/statuses) to simulate an action. */
function withEnemy(state: RunState, patch: Partial<EnemyInstance>): RunState {
  const combat = state.combat as CombatState;
  const enemy = combat.enemies[0] as EnemyInstance;
  return {
    ...state,
    combat: { ...combat, enemies: [{ ...enemy, ...patch }] },
  };
}

/** Build a multi-enemy combat RunState (all enemies full HP, on move 0). */
function multiCombat(defIds: readonly string[], hand: readonly string[] = []): RunState {
  const base = createRun(content, 'multi-test', DEFAULT_RUN_CONFIG);
  const enemies: EnemyInstance[] = defIds.map((defId) => {
    const def = content.enemies[defId];
    if (!def) throw new Error(`unknown enemy ${defId}`);
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

describe('CombatScreen compact hand (#74)', () => {
  const FULL_HAND = [
    'rusty-shortsword',
    'battered-buckler',
    'cleave-the-horde',
    'weakening-jab',
    'adrenaline-rush',
  ];

  it('fits a 3-enemy pack + full 5-card hand within the 28-row budget', () => {
    const { lastFrame } = render(
      <CombatScreen
        state={multiCombat(['lint-goblin', 'skeleton-intern', 'cave-rat'], FULL_HAND)}
        content={content}
        dispatch={noop}
        onViewDeck={noop}
      />,
    );
    const lines = (lastFrame() ?? '').split('\n');
    expect(lines.length).toBeLessThanOrEqual(28);
    // every rendered row stays within the content width
    const widest = Math.max(...lines.map((l) => l.length));
    expect(widest).toBeLessThanOrEqual(76);
  });

  it('renders each hand card as ONE compact text row (no bordered tile in combat)', () => {
    const { lastFrame } = render(
      <CombatScreen
        state={multiCombat(['cave-rat'], FULL_HAND)}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    // Combat hand no longer draws card-tile borders (those stay in reward/shop).
    expect(frame).not.toContain('╭');
    // The [N] marker, cost pip, name and (single-line) description coexist.
    const line = (frame.split('\n').find((l) => l.includes('Rusty Shortsword')) ?? '');
    expect(line).toContain('[1]');
    expect(line).toContain('(1)');
    expect(line).toContain('Deal 6 damage.');
  });

  it('never truncates a card NAME (the name column fits the widest card in hand)', () => {
    const { lastFrame } = render(
      <CombatScreen
        state={multiCombat(['cave-rat'], ['cleave-the-horde', 'adrenaline-rush'])}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Cleave the Horde');
    expect(frame).toContain('Adrenaline Rush');
  });

  it('keeps the live missing-HP gradient on the compact row (#65 survives #74)', () => {
    const base = multiCombat(['cave-rat'], ['meltdown-jab']);
    const combat = base.combat as CombatState;
    const state: RunState = {
      ...base,
      combat: { ...combat, playerHp: 30, playerMaxHp: 60 },
    };
    const { lastFrame } = render(
      <CombatScreen state={state} content={content} dispatch={noop} />,
    );
    expect(lastFrame() ?? '').toContain('now 8 dmg');
  });
});

describe('CombatScreen multi-enemy separation (#72)', () => {
  it('separates stacked enemy blocks with a blank row so each reads as a unit', () => {
    const { lastFrame } = render(
      <CombatScreen
        state={multiCombat(['lint-goblin', 'skeleton-intern'])}
        content={content}
        dispatch={noop}
      />,
    );
    const lines = (lastFrame() ?? '').split('\n');
    const first = lines.findIndex((l) => l.includes('Lint Goblin'));
    const second = lines.findIndex((l) => l.includes('Skeleton Intern'));
    expect(first).toBeGreaterThanOrEqual(0);
    expect(second).toBeGreaterThan(first);
    // A blank separator row sits between the first enemy's block (header+detail)
    // and the second enemy's header — the marginBottom gap that groups each unit.
    expect(lines.slice(first, second).some((l) => l.trim() === '')).toBe(true);
  });

  it('does NOT add a trailing gap after the last enemy (budget-aware spacing)', () => {
    const { lastFrame } = render(
      <CombatScreen
        state={multiCombat(['lint-goblin', 'skeleton-intern'])}
        content={content}
        dispatch={noop}
      />,
    );
    const lines = (lastFrame() ?? '').split('\n');
    // The last enemy is the Skeleton: its detail (HP bar) row is immediately
    // followed by the single hand-zone gap, not a gap+gap double blank.
    const detail = lines.findIndex(
      (l, i) => i > 0 && lines[i - 1]!.includes('Skeleton Intern') && l.includes('next:'),
    );
    expect(detail).toBeGreaterThan(0);
    // exactly one blank row before the "Your hand:" header (the zone seam).
    expect(lines[detail + 1]?.trim()).toBe('');
    expect(lines[detail + 2]?.trim()).not.toBe('');
  });
});

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

describe('CombatScreen juice beats (V6)', () => {
  it('shows no damage beat on the first combat render (no prior state)', () => {
    const { lastFrame } = render(
      <CombatScreen state={combatWith('skeleton-intern', 0)} content={content} dispatch={noop} />,
    );
    // First render has no prior to diff against → no `-N` beat anywhere.
    expect(lastFrame() ?? '').not.toMatch(/-\d+/);
  });

  it('shows a -N damage beat reflecting the HP lost on the last action', () => {
    const start = combatWith('skeleton-intern', 0);
    const full = (start.combat as CombatState).enemies[0]!.hp;
    const { lastFrame, rerender } = render(
      <CombatScreen state={start} content={content} dispatch={noop} />,
    );
    // The action lands: same combat object replaced with one where the enemy
    // took 7 damage → the diff surfaces a persistent `-7` beat.
    rerender(
      <CombatScreen state={withEnemyHp(start, full - 7)} content={content} dispatch={noop} />,
    );
    expect(lastFrame() ?? '').toContain('-7');
  });

  it('recomputes the beat on the next action (the old -N is gone)', () => {
    const start = combatWith('skeleton-intern', 0);
    const full = (start.combat as CombatState).enemies[0]!.hp;
    const { lastFrame, rerender } = render(
      <CombatScreen state={start} content={content} dispatch={noop} />,
    );
    rerender(<CombatScreen state={withEnemyHp(start, full - 7)} content={content} dispatch={noop} />);
    expect(lastFrame() ?? '').toContain('-7');
    // Next action deals 2 more (full-9): beat recomputes to the new delta only.
    rerender(<CombatScreen state={withEnemyHp(start, full - 9)} content={content} dispatch={noop} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('-2');
    expect(frame).not.toContain('-7');
  });

  it('shows a DOWN beat on an enemy slain this action', () => {
    const start = combatWith('skeleton-intern', 0);
    const { lastFrame, rerender } = render(
      <CombatScreen state={start} content={content} dispatch={noop} />,
    );
    rerender(<CombatScreen state={withEnemyHp(start, 0)} content={content} dispatch={noop} />);
    expect(lastFrame() ?? '').toContain('DOWN');
  });

  it('shows a +2VUL status beat on an enemy that gained Vulnerable this action', () => {
    const start = combatWith('skeleton-intern', 0);
    const { lastFrame, rerender } = render(
      <CombatScreen state={start} content={content} dispatch={noop} />,
    );
    // First render: no prior → no status beat yet.
    expect(lastFrame() ?? '').not.toContain('+2VUL');
    // The action lands Vulnerable 2 on the enemy → the diff surfaces +2VUL.
    rerender(
      <CombatScreen state={withEnemy(start, { statuses: { vulnerable: 2 } })} content={content} dispatch={noop} />,
    );
    expect(lastFrame() ?? '').toContain('+2VUL');
  });

  it('shows a big-hit `!` emphasis on a heavy damage beat (not on a chip)', () => {
    const start = combatWith('lint-goblin', 0);
    const full = (start.combat as CombatState).enemies[0]!.hp;
    const { lastFrame, rerender } = render(
      <CombatScreen state={start} content={content} dispatch={noop} />,
    );
    // A 15-damage blow (>= threshold) reads with the punchy marker.
    rerender(<CombatScreen state={withEnemyHp(start, full - 15)} content={content} dispatch={noop} />);
    expect(lastFrame() ?? '').toContain('-15!');
    // A 2-damage chip on the next action carries no emphasis.
    rerender(<CombatScreen state={withEnemyHp(start, full - 17)} content={content} dispatch={noop} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('-2');
    expect(frame).not.toContain('-2!');
  });

  it('reads an end-of-turn poison TICK as both a -N damage beat and a -1PSN beat', () => {
    // Enemy poisoned for 3: at turn resolution it loses 3 HP and poison decays by
    // 1 — the prior-vs-current diff captures BOTH (the DoT is legible, not silent).
    const start = withEnemy(combatWith('lint-goblin', 0), { statuses: { poison: 3 } });
    const full = (start.combat as CombatState).enemies[0]!.hp;
    const { lastFrame, rerender } = render(
      <CombatScreen state={start} content={content} dispatch={noop} />,
    );
    rerender(
      <CombatScreen
        state={withEnemy(start, { hp: full - 3, statuses: { poison: 2 } })}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('-3'); // HP lost to poison
    expect(frame).toContain('-1PSN'); // poison stack ticked down
  });

  it('shows NO status beat when statuses did not change between actions', () => {
    const start = withEnemy(combatWith('skeleton-intern', 0), { statuses: { vulnerable: 2 } });
    const full = (start.combat as CombatState).enemies[0]!.hp;
    const { lastFrame, rerender } = render(
      <CombatScreen state={start} content={content} dispatch={noop} />,
    );
    // A pure-damage action that leaves statuses untouched → no status beat.
    rerender(
      <CombatScreen
        state={withEnemy(start, { hp: full - 4, statuses: { vulnerable: 2 } })}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('-4'); // damage still reads
    expect(frame).not.toContain('+2VUL'); // no spurious status beat
    expect(frame).not.toContain('-0VUL');
  });

  it('surfaces an unplayable-card count in the footer when a card is unaffordable (#60)', () => {
    const start = combatWith('skeleton-intern', 0);
    const combat = start.combat as CombatState;
    // One affordable (cost<=energy) + two unaffordable cards at low energy.
    const cheap = Object.values(content.cards).find((c) => c.cost === 1)!;
    const dear = Object.values(content.cards).find((c) => c.cost >= 2)!;
    const state: RunState = {
      ...start,
      combat: { ...combat, hand: [cheap.id, dear.id, dear.id], energy: 1 },
    };
    const { lastFrame } = render(
      <CombatScreen state={state} content={content} dispatch={noop} />,
    );
    // Derived live from hand vs energy: two cards cost more than 1 energy.
    expect(lastFrame() ?? '').toContain('2 unplayable');
  });

  it('uses an ASCII-only separator in the footer — no U+00B7 middle dot (#71)', () => {
    const start = combatWith('skeleton-intern', 0);
    const combat = start.combat as CombatState;
    // A cost>=2 card at 0 energy is unplayable, so the separator before the
    // "N unplayable" segment is rendered.
    const dear = Object.values(content.cards).find((c) => c.cost >= 2)!;
    const state: RunState = {
      ...start,
      combat: { ...combat, hand: [dear.id], energy: 0 },
    };
    const { lastFrame } = render(
      <CombatScreen state={state} content={content} dispatch={noop} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('1 unplayable'); // separator segment is present
    expect(frame).not.toContain('·'); // ASCII-safe: no middle dot
  });

  it('shows NO unplayable hint when every card is affordable (#60)', () => {
    const start = combatWith('skeleton-intern', 0);
    const combat = start.combat as CombatState;
    const cheap = Object.values(content.cards).find((c) => c.cost <= 1)!;
    const state: RunState = {
      ...start,
      combat: { ...combat, hand: [cheap.id], energy: 3 },
    };
    const { lastFrame } = render(
      <CombatScreen state={state} content={content} dispatch={noop} />,
    );
    expect(lastFrame() ?? '').not.toContain('unplayable');
  });

  it('shows the LIVE gradient value of a missing-HP card, rising as HP drops (#65)', () => {
    // meltdown-jab: deal 5, +1 per 10 HP missing. At 30/60 missing = 30 → +3 → 8.
    const start = combatWith('skeleton-intern', 0);
    const combat = start.combat as CombatState;
    const state: RunState = {
      ...start,
      combat: { ...combat, hand: ['meltdown-jab'], playerHp: 30, playerMaxHp: 60 },
    };
    const { lastFrame } = render(
      <CombatScreen state={state} content={content} dispatch={noop} />,
    );
    // The effective number is surfaced (the "aha": hurt → bigger number).
    expect(lastFrame() ?? '').toContain('now 8 dmg');
  });

  it('shows only the base gradient value at full HP and NO live line for plain cards (#65)', () => {
    const start = combatWith('skeleton-intern', 0);
    const combat = start.combat as CombatState;
    // Full HP → bonus 0 → effective = base 5; a plain attack gets no live line.
    const state: RunState = {
      ...start,
      combat: { ...combat, hand: ['meltdown-jab', 'rusty-shortsword'], playerHp: 60, playerMaxHp: 60 },
    };
    const { lastFrame } = render(
      <CombatScreen state={state} content={content} dispatch={noop} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('now 5 dmg'); // gradient card, base at full HP
    expect((frame.match(/now \d+ /g) ?? []).length).toBe(1); // only the gradient card
  });

  it('opens the deck overlay on [v] without dispatching a combat action (#56)', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 25));
    const start = combatWith('skeleton-intern', 0);
    let opened = false;
    let dispatched = false;
    const { lastFrame, stdin } = render(
      <CombatScreen
        state={start}
        content={content}
        dispatch={() => {
          dispatched = true;
        }}
        onViewDeck={() => {
          opened = true;
        }}
      />,
    );
    // The affordance is advertised in the footer.
    expect(lastFrame() ?? '').toContain('[v] deck');
    await tick();
    stdin.write('v');
    await tick();
    expect(opened).toBe(true); // overlay requested
    expect(dispatched).toBe(false); // read-only: no combat action fired
  });
});
