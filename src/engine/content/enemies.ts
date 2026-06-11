import type { EnemyDef } from '../types.js';

const defs: readonly EnemyDef[] = [
  {
    id: 'cave-rat',
    name: 'Cave Rat',
    hp: [10, 14],
    moves: [
      { name: 'Bite', effects: [{ kind: 'damage', amount: 5, target: 'enemy' }] },
      {
        name: 'Gnaw',
        effects: [
          { kind: 'damage', amount: 3, target: 'enemy' },
          { kind: 'applyStatus', status: 'weak', stacks: 1, target: 'enemy' },
        ],
      },
    ],
  },
  {
    id: 'skeleton-intern',
    name: 'Skeleton Intern',
    hp: [18, 22],
    moves: [
      { name: 'Stapler Jab', effects: [{ kind: 'damage', amount: 7, target: 'enemy' }] },
      { name: 'Coffee Break', effects: [{ kind: 'block', amount: 6 }] },
      {
        name: 'Filing Frenzy',
        effects: [
          { kind: 'damage', amount: 4, target: 'enemy' },
          { kind: 'applyStatus', status: 'vulnerable', stacks: 1, target: 'enemy' },
        ],
      },
    ],
  },
  {
    id: 'mimic-crate',
    name: 'Mimic Crate',
    hp: [20, 26],
    moves: [
      { name: 'Chomp', effects: [{ kind: 'damage', amount: 9, target: 'enemy' }] },
      {
        name: 'Lid Slam',
        effects: [
          { kind: 'damage', amount: 5, target: 'enemy' },
          { kind: 'applyStatus', status: 'weak', stacks: 2, target: 'enemy' },
        ],
      },
    ],
  },
  {
    id: 'lint-goblin',
    name: 'Lint Goblin',
    hp: [30, 36],
    isElite: true,
    moves: [
      {
        name: 'Nitpick',
        effects: [{ kind: 'damage', amount: 4, target: 'enemy', times: 2 }],
      },
      {
        name: 'Style Violation',
        effects: [
          { kind: 'damage', amount: 9, target: 'enemy' },
          { kind: 'applyStatus', status: 'vulnerable', stacks: 2, target: 'enemy' },
        ],
      },
      {
        name: 'Refactor Rage',
        effects: [
          { kind: 'block', amount: 8 },
          { kind: 'applyStatus', status: 'strength', stacks: 1, target: 'self' },
        ],
      },
    ],
  },
  {
    id: 'the-scope-creep',
    name: 'The Scope Creep',
    hp: [72, 84],
    isBoss: true,
    moves: [
      {
        name: 'Just One More Feature',
        effects: [{ kind: 'damage', amount: 11, target: 'enemy' }],
      },
      {
        name: 'Requirements Shift',
        effects: [
          { kind: 'block', amount: 12 },
          { kind: 'applyStatus', status: 'strength', stacks: 2, target: 'self' },
        ],
      },
      {
        name: 'Deadline Crunch',
        effects: [{ kind: 'damage', amount: 7, target: 'enemy', times: 2 }],
      },
    ],
  },
];

export const enemies: Readonly<Record<string, EnemyDef>> = Object.fromEntries(
  defs.map((e) => [e.id, e]),
);
