import type { NarrativeEventDef } from '../types.js';

const defs: readonly NarrativeEventDef[] = [
  {
    id: 'abandoned-vending-machine',
    name: 'Abandoned Vending Machine',
    prompt:
      'A vending machine hums in the dark, decades from the nearest power outlet. Its glass is fogged with something that is probably condensation. RISK: kicking it could pay off — or rattle something loose in you.',
    options: [
      {
        // RISK/REWARD: a kick either jackpots, dribbles, or bites back.
        label: 'Kick it until something falls out (risky)',
        outcomes: [
          {
            kind: 'rollOutcomes',
            branches: [
              [{ kind: 'gainGold', amount: 55 }],
              [{ kind: 'gainGold', amount: 20 }],
              [{ kind: 'loseHp', amount: 8 }],
            ],
            weights: [1, 2, 1],
          },
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
    aftermath: {
      win: 'The machine shudders, satisfied, and goes dark. You leave with the goods.',
      loss: 'It clangs once in protest. You clutch the bruise and call it a draw.',
    },
  },
  {
    id: 'shrine-of-the-crawl',
    name: 'Shrine of the Crawl',
    prompt:
      'A squat stone shrine, worn smooth by ten thousand desperate hands. Coins glitter in the offering bowl. A sign reads: THE DUNGEON IS WATCHING.',
    options: [
      {
        label: 'Tithe and pray',
        outcomes: [
          { kind: 'loseGold', amount: 20 },
          { kind: 'gainMaxHp', amount: 6 },
        ],
      },
      {
        label: 'Pry up the offerings',
        outcomes: [
          { kind: 'gainGold', amount: 45 },
          { kind: 'loseHp', amount: 5 },
        ],
      },
    ],
    aftermath: {
      win: 'The shrine warms beneath your hand. Something is watching, and approves.',
      loss: 'The bowl is colder now, and so are you. THE DUNGEON IS WATCHING.',
    },
  },
  {
    id: 'goblin-toll-booth',
    name: 'Goblin Toll Booth',
    prompt:
      'A goblin in a regulation-size booth blocks the corridor. The sign lists seventeen toll categories. All of them apply to you. STAT CHECK: only the well-funded can simply pay.',
    options: [
      {
        // STAT GATE: paying the toll requires having the gold.
        label: 'Pay the toll',
        requires: { check: 'gold', atLeast: 30 },
        outcomes: [{ kind: 'loseGold', amount: 30 }],
      },
      { label: 'Squeeze past the barrier', outcomes: [{ kind: 'loseHp', amount: 7 }] },
      {
        label: 'Argue about jurisdiction',
        outcomes: [
          { kind: 'loseGold', amount: 10 },
          { kind: 'loseHp', amount: 3 },
        ],
      },
    ],
    aftermath: {
      win: 'The goblin stamps your hand and waves you through. Bureaucracy: defeated.',
      loss: 'The goblin files your suffering in triplicate. The corridor opens, grudgingly.',
    },
  },
  {
    id: 'abandoned-armory',
    name: 'Abandoned Armory',
    prompt:
      'Racks of equipment under centuries of dust. A sign reads: TAKE ONE. The handwriting is ominous.',
    options: [
      { label: 'Take the shield', outcomes: [{ kind: 'gainCard', cardId: 'shield-wall' }] },
      { label: 'Take the whetstone', outcomes: [{ kind: 'gainRelic', relicId: 'whetstone' }] },
      {
        label: 'Take everything, quickly (risky)',
        // RISK/REWARD: greed sometimes triggers the obvious trap.
        outcomes: [
          { kind: 'gainCard', cardId: 'shield-wall' },
          { kind: 'gainRelic', relicId: 'whetstone' },
          {
            kind: 'rollOutcomes',
            branches: [[{ kind: 'loseHp', amount: 8 }], [{ kind: 'loseHp', amount: 18 }]],
          },
        ],
      },
    ],
    aftermath: {
      win: 'You sling your spoils over a shoulder. The sign was, technically, obeyed.',
      loss: 'The trap was, of course, the obvious one. You take "one" — and a wound.',
    },
  },
  {
    id: 'complaints-department',
    name: 'The Complaints Department',
    prompt:
      'A window in the rock face, lit from within. The plaque says THE DUNGEON LISTENS. It does not.',
    options: [
      {
        label: 'File a formal complaint',
        outcomes: [
          { kind: 'gainGold', amount: 15 },
          { kind: 'loseHp', amount: 2 },
        ],
      },
      {
        label: 'Read the complaint wall (inspiring, but a long read)',
        outcomes: [
          { kind: 'gainMaxHp', amount: 6 },
          { kind: 'loseHp', amount: 4 },
        ],
      },
      { label: 'Leave quietly', outcomes: [] },
    ],
    aftermath: {
      win: 'A bell dings somewhere in the rock. Your complaint has been escalated. Nice.',
      loss: 'THE DUNGEON LISTENS, the plaque insists. It does not. You move on.',
    },
  },
  {
    id: 'suspicious-healer',
    name: 'Suspicious Healer',
    prompt:
      'A robed figure with too many rings gestures at a bubbling cauldron. "Free sample," it says, in a tone that has clearly said it many times.',
    options: [
      {
        label: 'Accept the free sample',
        outcomes: [
          { kind: 'loseHp', amount: 5 },
          { kind: 'gainMaxHp', amount: 6 },
        ],
      },
      {
        // STAT GATE: the real cure costs gold up front.
        label: 'Pay for the real thing',
        requires: { check: 'gold', atLeast: 35 },
        outcomes: [
          { kind: 'loseGold', amount: 35 },
          { kind: 'gainMaxHp', amount: 8 },
        ],
      },
      { label: 'Decline politely', outcomes: [] },
    ],
    aftermath: {
      win: 'The healer counts your coins twice and grins with too many teeth. A bargain.',
      loss: 'The "sample" sits wrong. The rings clink as the healer waves you off.',
    },
  },
  {
    id: 'traveling-alchemist',
    name: 'Traveling Alchemist',
    prompt:
      'A cart of bubbling vials, attended by someone with no eyebrows. "Potent stuff," they wheeze. RISK: the green vial does SOMETHING.',
    options: [
      {
        // RISK/REWARD: a good batch hands you a card; a bad batch just hurts.
        label: 'Quaff the green vial (risky)',
        outcomes: [
          {
            kind: 'rollOutcomes',
            branches: [
              [{ kind: 'gainCard', cardId: 'viral-load' }],
              [
                { kind: 'gainCard', cardId: 'viral-load' },
                { kind: 'loseHp', amount: 4 },
              ],
              [{ kind: 'loseHp', amount: 9 }],
            ],
            weights: [2, 2, 1],
          },
        ],
      },
      { label: 'Buy the antidote', outcomes: [{ kind: 'loseGold', amount: 25 }, { kind: 'gainMaxHp', amount: 5 }] },
      { label: 'Keep walking', outcomes: [] },
    ],
    aftermath: {
      win: 'The vial fizzes, then settles. The alchemist nods, eyebrowless and pleased.',
      loss: 'It was the green one. It is always the green one. You stagger on.',
    },
  },
  {
    id: 'cursed-idol',
    name: 'Cursed Idol',
    prompt:
      'A leering idol clutches something that gleams. The air smells faintly of regret. STAT CHECK: the well-warded come away clean; the rest pay in blood.',
    options: [
      {
        // CONDITIONAL: relic-rich crawlers are protected from the curse.
        label: 'Pry it loose',
        outcomes: [
          { kind: 'gainRelic', relicId: 'war-paint' },
          {
            kind: 'conditional',
            check: 'relics',
            atLeast: 3,
            ifPass: [{ kind: 'loseHp', amount: 2 }],
            ifFail: [{ kind: 'loseHp', amount: 9 }],
          },
        ],
      },
      { label: 'Leave it well alone', outcomes: [] },
    ],
    aftermath: {
      win: 'The idol\'s grin doesn\'t change, but its grip does. You take the prize clean.',
      loss: 'The idol keeps grinning while it bleeds you. You should have read the sign.',
    },
  },
  {
    id: 'abandoned-cache',
    name: 'Abandoned Cache',
    prompt: 'A strongbox wedged in the rubble. The lock is rusted; the hinges are not.',
    options: [
      {
        label: 'Force it open',
        outcomes: [
          { kind: 'gainGold', amount: 40 },
          { kind: 'loseHp', amount: 5 },
        ],
      },
      { label: 'Pick it carefully', outcomes: [{ kind: 'gainGold', amount: 20 }] },
    ],
    aftermath: {
      win: 'The box gives up its hoard with a tired creak. You pocket the lot.',
      loss: 'The hinges, it turns out, were the dangerous part. You count the cost.',
    },
  },
  {
    id: 'whispering-well',
    name: 'Whispering Well',
    prompt: 'A well exhales cold air and your own voice, slightly out of sync. RISK: the well bargains, but not always fairly.',
    options: [
      {
        // RISK/REWARD with a conditional safety net: drink and gamble on the depths.
        label: 'Drink deep (risky)',
        outcomes: [
          {
            kind: 'rollOutcomes',
            branches: [
              [{ kind: 'gainMaxHp', amount: 9 }],
              [
                { kind: 'gainMaxHp', amount: 5 },
                { kind: 'loseHp', amount: 6 },
              ],
              [{ kind: 'loseHp', amount: 10 }],
            ],
            weights: [2, 2, 1],
          },
        ],
      },
      {
        // STAT GATE: tossing a coin in needs a coin to spare.
        label: 'Toss in a coin',
        requires: { check: 'gold', atLeast: 20 },
        outcomes: [
          { kind: 'loseGold', amount: 20 },
          { kind: 'gainMaxHp', amount: 6 },
        ],
      },
      { label: 'Walk on', outcomes: [] },
    ],
    aftermath: {
      win: 'The well sighs your voice back to you, content. You drink your fill and rise.',
      loss: 'The well bargains, but not fairly. It keeps more than you offered.',
    },
  },
];

export const events: Readonly<Record<string, NarrativeEventDef>> = Object.fromEntries(
  defs.map((e) => [e.id, e]),
);
