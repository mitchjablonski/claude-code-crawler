import type { NarrativeEventDef } from '../types.js';

const defs: readonly NarrativeEventDef[] = [
  {
    id: 'abandoned-vending-machine',
    name: 'Abandoned Vending Machine',
    prompt:
      'A vending machine hums in the dark, decades from the nearest power outlet. Its glass is fogged with something that is probably condensation.',
    options: [
      {
        label: 'Kick it until something falls out',
        outcomes: [
          { kind: 'gainGold', amount: 30 },
          { kind: 'loseHp', amount: 4 },
        ],
      },
      {
        label: 'Reach inside the flap',
        outcomes: [
          { kind: 'gainCard', cardId: 'lucky-dagger' },
          { kind: 'loseHp', amount: 6 },
        ],
      },
      { label: 'Walk away', outcomes: [] },
    ],
  },
  {
    id: 'shrine-of-the-crawl',
    name: 'Shrine of the Crawl',
    prompt:
      'A squat stone shrine, worn smooth by ten thousand desperate hands. Coins glitter in the offering bowl. A sign reads: THE DUNGEON IS WATCHING.',
    options: [
      { label: 'Pray', outcomes: [{ kind: 'gainMaxHp', amount: 6 }] },
      {
        label: 'Pry up the offerings',
        outcomes: [
          { kind: 'gainGold', amount: 45 },
          { kind: 'loseHp', amount: 5 },
        ],
      },
    ],
  },
  // --- M6 content quota ---
  { id: 'goblin-toll-booth', name: 'Goblin Toll Booth', prompt: 'A goblin in a regulation-size booth blocks the corridor. The sign lists seventeen toll categories. All of them apply to you.', options: [
    { label: 'Pay the toll', outcomes: [{ kind: 'loseGold', amount: 30 }] },
    { label: 'Squeeze past the barrier', outcomes: [{ kind: 'loseHp', amount: 7 }] },
    { label: 'Argue about jurisdiction', outcomes: [{ kind: 'loseGold', amount: 10 }, { kind: 'loseHp', amount: 3 }] },
  ] },
  { id: 'abandoned-armory', name: 'Abandoned Armory', prompt: 'Racks of equipment under centuries of dust. A sign reads: TAKE ONE. The handwriting is ominous.', options: [
    { label: 'Take the shield', outcomes: [{ kind: 'gainCard', cardId: 'shield-wall' }] },
    { label: 'Take the whetstone', outcomes: [{ kind: 'gainRelic', relicId: 'whetstone' }] },
    { label: 'Take everything, quickly', outcomes: [{ kind: 'gainCard', cardId: 'shield-wall' }, { kind: 'gainRelic', relicId: 'whetstone' }, { kind: 'loseHp', amount: 16 }] },
  ] },
  { id: 'complaints-department', name: 'The Complaints Department', prompt: 'A window in the rock face, lit from within. The plaque says THE DUNGEON LISTENS. It does not.', options: [
    { label: 'File a formal complaint', outcomes: [{ kind: 'gainGold', amount: 15 }, { kind: 'loseHp', amount: 2 }] },
    { label: 'Read the complaint wall (inspiring, but a long read)', outcomes: [{ kind: 'gainMaxHp', amount: 6 }, { kind: 'loseHp', amount: 4 }] },
    { label: 'Leave quietly', outcomes: [] },
  ] },
  { id: 'suspicious-healer', name: 'Suspicious Healer', prompt: 'A robed figure with too many rings gestures at a bubbling cauldron. "Free sample," it says, in a tone that has clearly said it many times.', options: [
    { label: 'Accept the free sample', outcomes: [{ kind: 'loseHp', amount: 5 }, { kind: 'gainMaxHp', amount: 6 }] },
    { label: 'Pay for the real thing', outcomes: [{ kind: 'loseGold', amount: 35 }, { kind: 'gainMaxHp', amount: 8 }] },
    { label: 'Decline politely', outcomes: [] },
  ] },
];

export const events: Readonly<Record<string, NarrativeEventDef>> = Object.fromEntries(
  defs.map((e) => [e.id, e]),
);
