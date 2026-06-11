import type { RelicDef } from '../types.js';

const defs: readonly RelicDef[] = [
  {
    id: 'pocket-dice',
    name: 'Pocket Dice',
    description: 'At the start of each combat, draw 1 extra card.',
    trigger: 'combatStart',
    effects: [{ kind: 'draw', count: 1 }],
  },
  {
    id: 'old-warhorn',
    name: 'Old Warhorn',
    description: 'At the start of each combat, gain 1 Strength.',
    trigger: 'combatStart',
    effects: [{ kind: 'applyStatus', status: 'strength', stacks: 1, target: 'self' }],
  },
  {
    id: 'graphite-talisman',
    name: 'Graphite Talisman',
    description: 'At the start of each turn (after the first), gain 2 Block.',
    trigger: 'turnStart',
    effects: [{ kind: 'block', amount: 2 }],
  },
];

export const relics: Readonly<Record<string, RelicDef>> = Object.fromEntries(
  defs.map((r) => [r.id, r]),
);
