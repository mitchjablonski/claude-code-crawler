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
    hp: [96, 112],
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
  // --- M6 content quota ---
  { id: 'gelatinous-snack', name: 'Gelatinous Snack', hp: [14, 18], moves: [
    { name: 'Engulf', effects: [{ kind: 'damage', amount: 4, target: 'enemy' }] },
    { name: 'Reconstitute', effects: [{ kind: 'block', amount: 5 }, { kind: 'applyStatus', status: 'regen', stacks: 2, target: 'self' }] },
  ] },
  { id: 'cursed-stapler', name: 'Cursed Stapler', hp: [12, 16], moves: [
    { name: 'Staple', effects: [{ kind: 'damage', amount: 6, target: 'enemy' }] },
    { name: 'Double Click', effects: [{ kind: 'damage', amount: 2, target: 'enemy', times: 2 }] },
  ] },
  { id: 'doom-scroller', name: 'Doom Scroller', hp: [16, 20], moves: [
    { name: 'Dread Feed', effects: [{ kind: 'damage', amount: 3, target: 'enemy' }, { kind: 'applyStatus', status: 'weak', stacks: 1, target: 'enemy' }] },
    { name: 'Hot Take', effects: [{ kind: 'damage', amount: 5, target: 'enemy' }] },
    { name: 'Ratio', effects: [{ kind: 'block', amount: 4 }, { kind: 'applyStatus', status: 'vulnerable', stacks: 1, target: 'enemy' }] },
  ] },
  { id: 'spaghetti-golem', name: 'Spaghetti Golem', hp: [24, 30], moves: [
    { name: 'Tangle', effects: [{ kind: 'damage', amount: 8, target: 'enemy' }] },
    { name: 'Knot Up', effects: [{ kind: 'block', amount: 6 }] },
    { name: 'Loose Thread', effects: [{ kind: 'damage', amount: 5, target: 'enemy' }, { kind: 'applyStatus', status: 'weak', stacks: 1, target: 'enemy' }] },
  ] },
  { id: 'off-by-one', name: 'Off-By-One', hp: [11, 13], moves: [
    { name: 'Fence Post', effects: [{ kind: 'damage', amount: 7, target: 'enemy' }] },
    { name: 'Boundary Check', effects: [{ kind: 'block', amount: 3 }, { kind: 'damage', amount: 2, target: 'enemy' }] },
  ] },
  { id: 'merge-conflict', name: 'Merge Conflict', hp: [34, 40], isElite: true, moves: [
    { name: 'Both Changes', effects: [{ kind: 'damage', amount: 6, target: 'enemy', times: 2 }] },
    { name: 'Force Push', effects: [{ kind: 'damage', amount: 12, target: 'enemy' }] },
    { name: 'Rebase', effects: [{ kind: 'block', amount: 6 }, { kind: 'applyStatus', status: 'strength', stacks: 2, target: 'self' }] },
  ] },
];

export const enemies: Readonly<Record<string, EnemyDef>> = Object.fromEntries(
  defs.map((e) => [e.id, e]),
);
