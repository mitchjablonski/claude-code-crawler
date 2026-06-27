import type { CardDef } from '../types.js';

const defs: readonly CardDef[] = [
  {
    id: 'rusty-shortsword',
    name: 'Rusty Shortsword',
    description: 'Deal 6 damage.',
    type: 'attack',
    rarity: 'starter',
    cost: 1,
    target: 'enemy',
    effects: [{ kind: 'damage', amount: 6, target: 'enemy' }],
    upgradeTo: 'rusty-shortsword-plus',
  },
  {
    id: 'battered-buckler',
    name: 'Battered Buckler',
    description: 'Gain 5 Block.',
    type: 'skill',
    rarity: 'starter',
    cost: 1,
    target: 'self',
    effects: [{ kind: 'block', amount: 5 }],
    upgradeTo: 'battered-buckler-plus',
  },
  // --- D20: Knight kit-identity starters (guardian lean). starter rarity =>
  // NOT draftable (excluded from reward/shop pools), so these stay exclusive to
  // the Knight's starting deck. Each has a `-plus` rest-site upgrade (below).
  // Oath-Keeper is a block+draw tempo card: it pays for itself by replacing the
  // dead Rusty-Shortsword draws the old 5-sword deck suffered. Vanguard Stance
  // is a block+self-strength card that gives the Knight a real scaling identity
  // (every later attack hits harder), the guardian fantasy the class lacked.
  {
    id: 'oath-keeper',
    name: 'Oath-Keeper',
    description: 'Gain 5 Block. Draw 1 card.',
    type: 'skill',
    rarity: 'starter',
    cost: 1,
    target: 'self',
    effects: [
      { kind: 'block', amount: 5 },
      { kind: 'draw', count: 1 },
    ],
    upgradeTo: 'oath-keeper-plus',
  },
  {
    id: 'vanguard-stance',
    name: 'Vanguard Stance',
    description: 'Gain 5 Block and 1 Strength.',
    type: 'skill',
    rarity: 'starter',
    cost: 1,
    target: 'self',
    effects: [
      { kind: 'block', amount: 5 },
      { kind: 'applyStatus', status: 'strength', stacks: 1, target: 'self' },
    ],
    upgradeTo: 'vanguard-stance-plus',
  },
  // --- #26: Apothecary kit-identity starter (arc / multi-enemy lean). starter
  // rarity => NOT draftable (excluded from reward/shop pools), so it stays
  // exclusive to the Apothecary's starting deck. Has a `-plus` rest-site upgrade
  // (below). Spore Burst is a low-cost AoE attack (5 dmg + 1 poison to ALL
  // enemies) that hits the whole pack in one card and seeds the poison clock
  // across the room. In ARC's multi-enemy rooms its value scales with pack size
  // (it can soften or clear several enemies at once), closing the Apothecary's
  // arc gap the same way #20's kit cards closed the Knight's single gap. In
  // SINGLE (one boss) it reduces to ~5 dmg + 1 poison — roughly a shortsword,
  // strictly modest — so it lifts ARC far more than SINGLE and can't balloon the
  // already-even single matchup. Calibrated between cleave-the-horde (5 dmg all,
  // common) and whirlwind (6 dmg all, uncommon); justified as a non-draftable
  // kit exclusive that defines the arc-poison archetype.
  {
    id: 'spore-burst',
    name: 'Spore Burst',
    description: 'Deal 5 damage to all enemies. Apply 1 Poison to all enemies.',
    type: 'attack',
    rarity: 'starter',
    cost: 1,
    target: 'allEnemies',
    effects: [
      { kind: 'damage', amount: 5, target: 'allEnemies' },
      { kind: 'applyStatus', status: 'poison', stacks: 1, target: 'allEnemies' },
    ],
    upgradeTo: 'spore-burst-plus',
  },
  {
    id: 'goblin-stomp',
    // #55: dead 2-cost (8 dmg + 2 vuln) — strictly worse per energy than
    // torch-jab (1-cost 8 dmg + 1 vuln). Bump the damage/vuln ratio for its cost
    // so it's a real cost-2 vulnerable-setter: 11 dmg + 2 vuln (still under
    // crippling-blow's 10+2weak tempo when you factor the +damage, modest).
    name: 'Goblin Stomp',
    description: 'Deal 11 damage. Apply 2 Vulnerable.',
    type: 'attack',
    rarity: 'common',
    cost: 2,
    target: 'enemy',
    effects: [
      { kind: 'damage', amount: 11, target: 'enemy' },
      { kind: 'applyStatus', status: 'vulnerable', stacks: 2, target: 'enemy' },
    ],
    upgradeTo: 'goblin-stomp-plus',
  },
  {
    id: 'cleave-the-horde',
    // #55: dead AoE common — at 5 dmg all it was a worse spore-burst (starter,
    // 5 dmg + 1 poison all) with no poison rider and no upside. Differentiate via
    // a small AoE vulnerable RIDER (knight has no poison archetype): 6 dmg + 1
    // Vulnerable to all enemies at cost 1. Still under whirlwind (2-cost AoE with
    // a single-target floor) and under torch-jab's single-target tempo, so it
    // lifts the pack-clear common without overshoot.
    name: 'Cleave the Horde',
    description: 'Deal 6 damage to all enemies. Apply 1 Vulnerable to all enemies.',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'allEnemies',
    effects: [
      { kind: 'damage', amount: 6, target: 'allEnemies' },
      { kind: 'applyStatus', status: 'vulnerable', stacks: 1, target: 'allEnemies' },
    ],
    upgradeTo: 'cleave-the-horde-plus',
  },
  {
    id: 'weakening-jab',
    name: 'Weakening Jab',
    description: 'Deal 5 damage. Apply 2 Weak.',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'enemy',
    effects: [
      { kind: 'damage', amount: 5, target: 'enemy' },
      { kind: 'applyStatus', status: 'weak', stacks: 2, target: 'enemy' },
    ],
    upgradeTo: 'weakening-jab-plus',
  },
  {
    id: 'second-breakfast',
    // #55: dead heal-cantrip — 3 HP + draw 1 was too little sustain to draft over
    // a pure draw/tempo skill. Bump heal 3→5 (still a modest cost-1 sustain
    // cantrip, under second-wind's 6 raw heal which has no draw).
    name: 'Second Breakfast',
    description: 'Heal 5 HP. Draw 1 card.',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    effects: [{ kind: 'heal', amount: 5 }, { kind: 'draw', count: 1 }],
    upgradeTo: 'second-breakfast-plus',
  },
  {
    id: 'shield-wall',
    // #55: dead 2-cost wall — 14 block/2 was strictly worse per energy than
    // warding-stone (8/1) and not enough of a lump to justify the 2-cost slot.
    // Drop cost 2→1 at 10 block: a modest efficiency bump over warding-stone (8/1)
    // that makes it the dedicated 1-cost "wall" common, still under bulwark
    // (uncommon, 16/2) per energy.
    name: 'Shield Wall',
    description: 'Gain 10 Block.',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    effects: [{ kind: 'block', amount: 10 }],
    upgradeTo: 'shield-wall-plus',
  },
  {
    id: 'adrenaline-rush',
    name: 'Adrenaline Rush',
    description: 'Draw 2 cards.',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    target: 'self',
    effects: [{ kind: 'draw', count: 2 }],
  },
  {
    id: 'flurry-of-knives',
    name: 'Flurry of Knives',
    description: 'Deal 3 damage three times.',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    target: 'enemy',
    effects: [{ kind: 'damage', amount: 3, target: 'enemy', times: 3 }],
    upgradeTo: 'flurry-of-knives-plus',
  },
  {
    id: 'liquid-courage',
    name: 'Liquid Courage',
    description: 'Gain 2 Strength.',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    effects: [{ kind: 'applyStatus', status: 'strength', stacks: 2, target: 'self' }],
  },
  {
    id: 'troll-blood',
    name: 'Troll Blood',
    description: 'Gain 4 Regen.',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    effects: [{ kind: 'applyStatus', status: 'regen', stacks: 4, target: 'self' }],
  },
  {
    id: 'lucky-dagger',
    // #42: conditional-effect identity ("×2 if poisoned"). Base 7 dmg + a
    // conditional 7 bonus when the target is poisoned (>=1), so it hits 14 when
    // a poison build is online and 7 when cold. Tuning: the old flat 11 became a
    // 7/14 swing — STRICTLY WORSE unset up (7 vs 11) and BETTER set up (14 vs 11)
    // without ballooning (14 is still a rare 2-cost, below Guillotine's 24). Keeps
    // the draw-2 so it stays a tempo-positive finisher in the poison archetype.
    name: 'Lucky Dagger',
    description: 'Deal 7 damage. If the target is Poisoned, deal 7 more. Draw 2 cards.',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'enemy',
    effects: [
      { kind: 'damage', amount: 7, target: 'enemy' },
      {
        kind: 'conditional',
        condition: { type: 'targetHasStatus', status: 'poison', atLeast: 1 },
        then: [{ kind: 'damage', amount: 7, target: 'enemy' }],
      },
      { kind: 'draw', count: 2 },
    ],
    upgradeTo: 'lucky-dagger-plus',
  },
  {
    id: 'last-stand',
    name: 'Last Stand',
    description: 'Gain 20 Block.',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    effects: [{ kind: 'block', amount: 20 }],
  },
  // --- M6 content quota ---
  // Commons
  { id: 'rat-bite', name: 'Rat Bite', description: 'Deal 5 damage.', type: 'attack', rarity: 'common', cost: 0, target: 'enemy', effects: [{ kind: 'damage', amount: 5, target: 'enemy' }], upgradeTo: 'rat-bite-plus' },
  { id: 'brace', name: 'Brace', description: 'Gain 5 Block.', type: 'skill', rarity: 'common', cost: 0, target: 'self', effects: [{ kind: 'block', amount: 5 }] },
  { id: 'pommel-strike', name: 'Pommel Strike', description: 'Deal 6 damage. Draw 1 card.', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 6, target: 'enemy' }, { kind: 'draw', count: 1 }], upgradeTo: 'pommel-strike-plus' },
  { id: 'torch-jab', name: 'Torch Jab', description: 'Deal 8 damage. Apply 1 Vulnerable.', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 8, target: 'enemy' }, { kind: 'applyStatus', status: 'vulnerable', stacks: 1, target: 'enemy' }], upgradeTo: 'torch-jab-plus' },
  // #55: dead vanilla 2-cost attack (14 dmg, no rider) — flat damage with no
  // scaling lost to riders like crippling-blow (10+2weak). Add a +1 Strength
  // self-rider so it scales the rest of the turn/combat: 14 dmg + 1 Strength at
  // cost 2. Modest (under guillotine 24/3) and gives it a build identity.
  { id: 'heavy-swing', name: 'Heavy Swing', description: 'Deal 14 damage. Gain 1 Strength.', type: 'attack', rarity: 'common', cost: 2, target: 'enemy', effects: [{ kind: 'damage', amount: 14, target: 'enemy' }, { kind: 'applyStatus', status: 'strength', stacks: 1, target: 'self' }], upgradeTo: 'heavy-swing-plus' },
  { id: 'spiked-shield', name: 'Spiked Shield', description: 'Gain 6 Block. Deal 3 damage.', type: 'skill', rarity: 'common', cost: 1, target: 'enemy', effects: [{ kind: 'block', amount: 6 }, { kind: 'damage', amount: 3, target: 'enemy' }] },
  { id: 'field-rations', name: 'Field Rations', description: 'Heal 4 HP. Gain 5 Block.', type: 'skill', rarity: 'common', cost: 1, target: 'self', effects: [{ kind: 'heal', amount: 4 }, { kind: 'block', amount: 5 }] },
  // Uncommons
  // #42: whirlwind keeps its AoE identity but gains a single-target FLOOR via a
  // conditional — vs exactly one enemy (a lone boss/elite) it deals +5, so it is
  // no longer near-dead in single-target rooms (6→11 vs a boss, ~a Heavy-Swing).
  // Inert in multi-enemy rooms (count != 1 → no bonus), so its arc value is
  // unchanged. Tuned modestly (11 single < 14 Heavy-Swing at cost 2) so the floor
  // rescues it without making the AoE card a premier single-target attack.
  { id: 'whirlwind', name: 'Whirlwind', description: 'Deal 6 damage to all enemies. If there is only one enemy, deal 5 more.', type: 'attack', rarity: 'uncommon', cost: 2, target: 'allEnemies', effects: [{ kind: 'damage', amount: 6, target: 'allEnemies' }, { kind: 'conditional', condition: { type: 'enemyCount', op: 'eq', value: 1 }, then: [{ kind: 'damage', amount: 5, target: 'allEnemies' }] }], upgradeTo: 'whirlwind-plus' },
  { id: 'battle-trance', name: 'Battle Trance', description: 'Draw 2 cards. Gain 1 Energy.', type: 'skill', rarity: 'uncommon', cost: 1, target: 'self', effects: [{ kind: 'draw', count: 2 }, { kind: 'gainEnergy', amount: 1 }] },
  { id: 'iron-hide', name: 'Iron Hide', description: 'Gain 3 Regen.', type: 'power', rarity: 'uncommon', cost: 1, target: 'self', effects: [{ kind: 'applyStatus', status: 'regen', stacks: 3, target: 'self' }] },
  { id: 'second-wind', name: 'Second Wind', description: 'Heal 6 HP.', type: 'skill', rarity: 'uncommon', cost: 1, target: 'self', effects: [{ kind: 'heal', amount: 6 }] },
  { id: 'crippling-blow', name: 'Crippling Blow', description: 'Deal 10 damage. Apply 2 Weak.', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy', effects: [{ kind: 'damage', amount: 10, target: 'enemy' }, { kind: 'applyStatus', status: 'weak', stacks: 2, target: 'enemy' }], upgradeTo: 'crippling-blow-plus' },
  { id: 'shield-bash', name: 'Shield Bash', description: 'Deal 6 damage. Gain 4 Block.', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 6, target: 'enemy' }, { kind: 'block', amount: 4 }] },
  // Rares
  { id: 'avalanche', name: 'Avalanche', description: 'Deal 12 damage to all enemies. Draw 1 card.', type: 'attack', rarity: 'rare', cost: 2, target: 'allEnemies', effects: [{ kind: 'damage', amount: 12, target: 'allEnemies' }, { kind: 'draw', count: 1 }] },
  { id: 'berserker-brew', name: 'Berserker Brew', description: 'Gain 3 Strength and 1 Dexterity.', type: 'power', rarity: 'rare', cost: 2, target: 'self', effects: [{ kind: 'applyStatus', status: 'strength', stacks: 3, target: 'self' }, { kind: 'applyStatus', status: 'dexterity', stacks: 1, target: 'self' }] },
  { id: 'phoenix-feather', name: 'Phoenix Feather', description: 'Heal 12 HP.', type: 'skill', rarity: 'rare', cost: 2, target: 'self', effects: [{ kind: 'heal', amount: 12 }] },
  { id: 'perfect-parry', name: 'Perfect Parry', description: 'Gain 10 Block. Draw 1 card.', type: 'skill', rarity: 'rare', cost: 2, target: 'self', effects: [{ kind: 'block', amount: 10 }, { kind: 'draw', count: 1 }] },
  { id: 'guillotine', name: 'Guillotine', description: 'Deal 24 damage.', type: 'attack', rarity: 'rare', cost: 3, target: 'enemy', effects: [{ kind: 'damage', amount: 24, target: 'enemy' }], upgradeTo: 'guillotine-plus' },
  // --- M12 expansion: poison + dexterity archetypes ---
  // Commons
  { id: 'venom-dart', name: 'Venom Dart', description: 'Apply 3 Poison.', type: 'attack', rarity: 'common', cost: 0, target: 'enemy', effects: [{ kind: 'applyStatus', status: 'poison', stacks: 3, target: 'enemy' }], upgradeTo: 'venom-dart-plus' },
  { id: 'tipped-blade', name: 'Tipped Blade', description: 'Deal 4 damage. Apply 2 Poison.', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 4, target: 'enemy' }, { kind: 'applyStatus', status: 'poison', stacks: 2, target: 'enemy' }], upgradeTo: 'tipped-blade-plus' },
  { id: 'limber', name: 'Limber', description: 'Gain 1 Dexterity. Gain 4 Block.', type: 'power', rarity: 'common', cost: 1, target: 'self', effects: [{ kind: 'applyStatus', status: 'dexterity', stacks: 1, target: 'self' }, { kind: 'block', amount: 4 }] },
  // #55: still dead at 4 block + draw 1 — a touch light next to the draw/tempo
  // skills. Bump block 4→5 (closer to adrenaline-rush tempo) without adding a
  // second draw, so it stays a modest block-cantrip.
  { id: 'sidestep', name: 'Sidestep', description: 'Gain 5 Block. Draw 1 card.', type: 'skill', rarity: 'common', cost: 1, target: 'self', effects: [{ kind: 'block', amount: 5 }, { kind: 'draw', count: 1 }] },
  { id: 'throwing-knife', name: 'Throwing Knife', description: 'Deal 4 damage.', type: 'attack', rarity: 'common', cost: 0, target: 'enemy', effects: [{ kind: 'damage', amount: 4, target: 'enemy' }] },
  // #55: dead pure-block common (8 block/1) — flat block with no scaling lost to
  // riders. Add a +1 Dexterity scaling rider (every future block card gets +1),
  // trimming the flat block 8→6 to pay for it: 6 block + 1 Dexterity at cost 1.
  // Sits right by limber (4 block + 1 dex, common) — a hair more block — and the
  // dex makes it a dexterity-archetype enabler rather than linear block.
  { id: 'warding-stone', name: 'Warding Stone', description: 'Gain 6 Block. Gain 1 Dexterity.', type: 'skill', rarity: 'common', cost: 1, target: 'self', effects: [{ kind: 'block', amount: 6 }, { kind: 'applyStatus', status: 'dexterity', stacks: 1, target: 'self' }] },
  { id: 'twin-jab', name: 'Twin Jab', description: 'Deal 4 damage twice.', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 4, target: 'enemy', times: 2 }] },
  // Uncommons
  // #55: dead AoE-poison uncommon — 2 poison all/1 was too thin a clock to draft.
  // Bump 2→4 poison all at cost 1. Still well under corrosive-mist (rare, 6 poison
  // all + 1 energy /2) per energy, and it seeds a real pack-wide poison clock.
  { id: 'toxic-cloud', name: 'Toxic Cloud', description: 'Apply 4 Poison to all enemies.', type: 'attack', rarity: 'uncommon', cost: 1, target: 'allEnemies', effects: [{ kind: 'applyStatus', status: 'poison', stacks: 4, target: 'allEnemies' }] },
  { id: 'caltrops', name: 'Caltrops', description: 'Gain 2 Dexterity.', type: 'power', rarity: 'uncommon', cost: 1, target: 'self', effects: [{ kind: 'applyStatus', status: 'dexterity', stacks: 2, target: 'self' }] },
  { id: 'rupture', name: 'Rupture', description: 'Deal 6 damage. Apply 3 Poison.', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 6, target: 'enemy' }, { kind: 'applyStatus', status: 'poison', stacks: 3, target: 'enemy' }] },
  { id: 'bulwark', name: 'Bulwark', description: 'Gain 16 Block.', type: 'skill', rarity: 'uncommon', cost: 2, target: 'self', effects: [{ kind: 'block', amount: 16 }] },
  { id: 'venom-blade', name: 'Venom Blade', description: 'Deal 5 damage. Apply 2 Poison. Draw 1 card.', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 5, target: 'enemy' }, { kind: 'applyStatus', status: 'poison', stacks: 2, target: 'enemy' }, { kind: 'draw', count: 1 }] },
  // #45: POISON PAYOFF (closes the apothecary nightmare gap without class-gating).
  // Cold (target NOT poisoned) it is a plain 5-dmg 1-cost attack — strictly worse
  // than torch-jab (8 dmg)/heavy-swing per cost, so a knight rarely wants it. When
  // the target is already poisoned (apothecary's wheelhouse) it nearly triples in
  // value: +5 dmg AND +2 Poison, ACCELERATING the slow poison ramp that was losing
  // the long high-HP boss race. It REWARDS existing poison (conditional, #42) but
  // does not CONSUME it, so there is no detonate one-shot loop — the +2 poison it
  // adds still ticks down 1/round like all poison (no compounding explosion).
  { id: 'venom-reprisal', name: 'Venom Reprisal', description: 'Deal 5 damage. If the target is Poisoned, deal 5 more and apply 2 Poison.', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 5, target: 'enemy' }, { kind: 'conditional', condition: { type: 'targetHasStatus', status: 'poison', atLeast: 1 }, then: [{ kind: 'damage', amount: 5, target: 'enemy' }, { kind: 'applyStatus', status: 'poison', stacks: 2, target: 'enemy' }] }], upgradeTo: 'venom-reprisal-plus' },
  { id: 'stone-skin', name: 'Stone Skin', description: 'Gain 1 Dexterity and 5 Block.', type: 'power', rarity: 'uncommon', cost: 1, target: 'self', effects: [{ kind: 'applyStatus', status: 'dexterity', stacks: 1, target: 'self' }, { kind: 'block', amount: 5 }] },
  // Rares
  { id: 'viral-load', name: 'Viral Load', description: 'Apply 10 Poison. Gain 1 Energy.', type: 'attack', rarity: 'rare', cost: 2, target: 'enemy', effects: [{ kind: 'applyStatus', status: 'poison', stacks: 10, target: 'enemy' }, { kind: 'gainEnergy', amount: 1 }] },
  // #55: dead rare (MCTS 0.00) — pure 3 dex/2 had no immediate value, so it lost
  // to caltrops (2 dex/1 uncommon) which ramps cheaper. Add an IMMEDIATE 6 Block
  // so the turn it lands it already pays off (and the 6 block itself is boosted
  // +3 by the dex it grants this same turn). 3 Dexterity + 6 Block at cost 2 — a
  // dex-lean rare next to last-bastion (18 block + 1 dex /2), no longer dead.
  { id: 'iron-stance', name: 'Iron Stance', description: 'Gain 3 Dexterity. Gain 6 Block.', type: 'power', rarity: 'rare', cost: 2, target: 'self', effects: [{ kind: 'applyStatus', status: 'dexterity', stacks: 3, target: 'self' }, { kind: 'block', amount: 6 }] },
  { id: 'corrosive-mist', name: 'Corrosive Mist', description: 'Apply 6 Poison to all enemies. Gain 1 Energy.', type: 'attack', rarity: 'rare', cost: 2, target: 'allEnemies', effects: [{ kind: 'applyStatus', status: 'poison', stacks: 6, target: 'allEnemies' }, { kind: 'gainEnergy', amount: 1 }] },
  { id: 'juggernaut', name: 'Juggernaut', description: 'Gain 2 Strength and 1 Dexterity.', type: 'power', rarity: 'rare', cost: 1, target: 'self', effects: [{ kind: 'applyStatus', status: 'strength', stacks: 2, target: 'self' }, { kind: 'applyStatus', status: 'dexterity', stacks: 1, target: 'self' }] },
  { id: 'plague', name: 'Plague', description: 'Apply 5 Poison. Draw 1 card.', type: 'attack', rarity: 'rare', cost: 1, target: 'enemy', effects: [{ kind: 'applyStatus', status: 'poison', stacks: 5, target: 'enemy' }, { kind: 'draw', count: 1 }] },
  { id: 'last-bastion', name: 'Last Bastion', description: 'Gain 18 Block and 1 Dexterity.', type: 'skill', rarity: 'rare', cost: 2, target: 'self', effects: [{ kind: 'block', amount: 18 }, { kind: 'applyStatus', status: 'dexterity', stacks: 1, target: 'self' }] },
  // --- D1: upgraded variants ('<base>-plus'). NEVER draftable: each is some
  // other card's upgradeTo target, so the draft pool filters them out. Reachable
  // only by upgrading a base card at a rest site. No further upgradeTo (no chains).
  // Starter upgrades
  { id: 'rusty-shortsword-plus', name: 'Rusty Shortsword+', description: 'Deal 9 damage.', type: 'attack', rarity: 'starter', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 9, target: 'enemy' }] },
  { id: 'battered-buckler-plus', name: 'Battered Buckler+', description: 'Gain 8 Block.', type: 'skill', rarity: 'starter', cost: 1, target: 'self', effects: [{ kind: 'block', amount: 8 }] },
  { id: 'oath-keeper-plus', name: 'Oath-Keeper+', description: 'Gain 8 Block. Draw 1 card.', type: 'skill', rarity: 'starter', cost: 1, target: 'self', effects: [{ kind: 'block', amount: 8 }, { kind: 'draw', count: 1 }] },
  { id: 'vanguard-stance-plus', name: 'Vanguard Stance+', description: 'Gain 7 Block and 1 Strength.', type: 'skill', rarity: 'starter', cost: 1, target: 'self', effects: [{ kind: 'block', amount: 7 }, { kind: 'applyStatus', status: 'strength', stacks: 1, target: 'self' }] },
  { id: 'spore-burst-plus', name: 'Spore Burst+', description: 'Deal 7 damage to all enemies. Apply 2 Poison to all enemies.', type: 'attack', rarity: 'starter', cost: 1, target: 'allEnemies', effects: [{ kind: 'damage', amount: 7, target: 'allEnemies' }, { kind: 'applyStatus', status: 'poison', stacks: 2, target: 'allEnemies' }] },
  // Common upgrades
  { id: 'goblin-stomp-plus', name: 'Goblin Stomp+', description: 'Deal 14 damage. Apply 3 Vulnerable.', type: 'attack', rarity: 'common', cost: 2, target: 'enemy', effects: [{ kind: 'damage', amount: 14, target: 'enemy' }, { kind: 'applyStatus', status: 'vulnerable', stacks: 3, target: 'enemy' }] },
  { id: 'cleave-the-horde-plus', name: 'Cleave the Horde+', description: 'Deal 9 damage to all enemies. Apply 2 Vulnerable to all enemies.', type: 'attack', rarity: 'common', cost: 1, target: 'allEnemies', effects: [{ kind: 'damage', amount: 9, target: 'allEnemies' }, { kind: 'applyStatus', status: 'vulnerable', stacks: 2, target: 'allEnemies' }] },
  { id: 'weakening-jab-plus', name: 'Weakening Jab+', description: 'Deal 7 damage. Apply 3 Weak.', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 7, target: 'enemy' }, { kind: 'applyStatus', status: 'weak', stacks: 3, target: 'enemy' }] },
  { id: 'second-breakfast-plus', name: 'Second Breakfast+', description: 'Heal 8 HP. Draw 1 card.', type: 'skill', rarity: 'common', cost: 1, target: 'self', effects: [{ kind: 'heal', amount: 8 }, { kind: 'draw', count: 1 }] },
  { id: 'shield-wall-plus', name: 'Shield Wall+', description: 'Gain 14 Block.', type: 'skill', rarity: 'common', cost: 1, target: 'self', effects: [{ kind: 'block', amount: 14 }] },
  { id: 'rat-bite-plus', name: 'Rat Bite+', description: 'Deal 8 damage.', type: 'attack', rarity: 'common', cost: 0, target: 'enemy', effects: [{ kind: 'damage', amount: 8, target: 'enemy' }] },
  { id: 'pommel-strike-plus', name: 'Pommel Strike+', description: 'Deal 9 damage. Draw 1 card.', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 9, target: 'enemy' }, { kind: 'draw', count: 1 }] },
  { id: 'torch-jab-plus', name: 'Torch Jab+', description: 'Deal 11 damage. Apply 2 Vulnerable.', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 11, target: 'enemy' }, { kind: 'applyStatus', status: 'vulnerable', stacks: 2, target: 'enemy' }] },
  { id: 'heavy-swing-plus', name: 'Heavy Swing+', description: 'Deal 19 damage. Gain 2 Strength.', type: 'attack', rarity: 'common', cost: 2, target: 'enemy', effects: [{ kind: 'damage', amount: 19, target: 'enemy' }, { kind: 'applyStatus', status: 'strength', stacks: 2, target: 'self' }] },
  { id: 'venom-dart-plus', name: 'Venom Dart+', description: 'Apply 5 Poison.', type: 'attack', rarity: 'common', cost: 0, target: 'enemy', effects: [{ kind: 'applyStatus', status: 'poison', stacks: 5, target: 'enemy' }] },
  { id: 'tipped-blade-plus', name: 'Tipped Blade+', description: 'Deal 6 damage. Apply 4 Poison.', type: 'attack', rarity: 'common', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 6, target: 'enemy' }, { kind: 'applyStatus', status: 'poison', stacks: 4, target: 'enemy' }] },
  // Uncommon upgrades
  { id: 'flurry-of-knives-plus', name: 'Flurry of Knives+', description: 'Deal 4 damage three times.', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 4, target: 'enemy', times: 3 }] },
  { id: 'whirlwind-plus', name: 'Whirlwind+', description: 'Deal 9 damage to all enemies. If there is only one enemy, deal 6 more.', type: 'attack', rarity: 'uncommon', cost: 2, target: 'allEnemies', effects: [{ kind: 'damage', amount: 9, target: 'allEnemies' }, { kind: 'conditional', condition: { type: 'enemyCount', op: 'eq', value: 1 }, then: [{ kind: 'damage', amount: 6, target: 'allEnemies' }] }] },
  { id: 'crippling-blow-plus', name: 'Crippling Blow+', description: 'Deal 14 damage. Apply 3 Weak.', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy', effects: [{ kind: 'damage', amount: 14, target: 'enemy' }, { kind: 'applyStatus', status: 'weak', stacks: 3, target: 'enemy' }] },
  // #45: upgraded payoff — cold stays a modest 6-dmg 1-cost; set up it hits 6+7 and
  // applies 3 Poison (a bigger ramp accelerator), still no consume/loop.
  { id: 'venom-reprisal-plus', name: 'Venom Reprisal+', description: 'Deal 6 damage. If the target is Poisoned, deal 7 more and apply 3 Poison.', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 6, target: 'enemy' }, { kind: 'conditional', condition: { type: 'targetHasStatus', status: 'poison', atLeast: 1 }, then: [{ kind: 'damage', amount: 7, target: 'enemy' }, { kind: 'applyStatus', status: 'poison', stacks: 3, target: 'enemy' }] }] },
  // Rare upgrades
  { id: 'lucky-dagger-plus', name: 'Lucky Dagger+', description: 'Deal 9 damage. If the target is Poisoned, deal 9 more. Draw 2 cards.', type: 'attack', rarity: 'rare', cost: 2, target: 'enemy', effects: [{ kind: 'damage', amount: 9, target: 'enemy' }, { kind: 'conditional', condition: { type: 'targetHasStatus', status: 'poison', atLeast: 1 }, then: [{ kind: 'damage', amount: 9, target: 'enemy' }] }, { kind: 'draw', count: 2 }] },
  { id: 'guillotine-plus', name: 'Guillotine+', description: 'Deal 32 damage.', type: 'attack', rarity: 'rare', cost: 3, target: 'enemy', effects: [{ kind: 'damage', amount: 32, target: 'enemy' }] },
  // --- E2: UNLOCKABLE extra cards. Each carries an `unlock` milestone id and is
  // EXCLUDED from the draft pool until that milestone is earned (UNLOCKABLE_CARD_IDS
  // is filtered out of rollCardChoices by default). Core cards above stay always
  // draftable, so a fresh player's pool is byte-identical to pre-E2. Balanced to
  // sit alongside same-rarity core cards. NOT upgradeable (no upgradeTo).
  // first-victory grants (one common, one uncommon) — modest, broadly useful.
  { id: 'heroic-second-wind', name: 'Heroic Second Wind', description: 'Heal 5 HP. Gain 4 Block.', type: 'skill', rarity: 'common', cost: 1, target: 'self', effects: [{ kind: 'heal', amount: 5 }, { kind: 'block', amount: 4 }], unlock: 'first-victory' },
  { id: 'crawlers-resolve', name: "Crawler's Resolve", description: 'Deal 7 damage. Gain 5 Block.', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy', effects: [{ kind: 'damage', amount: 7, target: 'enemy' }, { kind: 'block', amount: 5 }], unlock: 'first-victory' },
  // arc-victory grant — an arc-flavored payoff card.
  { id: 'arc-warden', name: 'Arc Warden', description: 'Gain 12 Block and 1 Dexterity.', type: 'skill', rarity: 'uncommon', cost: 2, target: 'self', effects: [{ kind: 'block', amount: 12 }, { kind: 'applyStatus', status: 'dexterity', stacks: 1, target: 'self' }], unlock: 'arc-victory' },
  // three-victories grant — a veteran's rare power.
  { id: 'veterans-edge', name: "Veteran's Edge", description: 'Gain 2 Strength and 1 Dexterity. Draw 1 card.', type: 'power', rarity: 'rare', cost: 2, target: 'self', effects: [{ kind: 'applyStatus', status: 'strength', stacks: 2, target: 'self' }, { kind: 'applyStatus', status: 'dexterity', stacks: 1, target: 'self' }, { kind: 'draw', count: 1 }], unlock: 'three-victories' },
  // hard-victory grant — a hard-won aggressive rare (relic-equivalent earned same milestone).
  { id: 'hard-won-strike', name: 'Hard-Won Strike', description: 'Deal 16 damage. Apply 2 Vulnerable.', type: 'attack', rarity: 'rare', cost: 2, target: 'enemy', effects: [{ kind: 'damage', amount: 16, target: 'enemy' }, { kind: 'applyStatus', status: 'vulnerable', stacks: 2, target: 'enemy' }], unlock: 'hard-victory' },
];

/**
 * Set of card ids that are SOME card's `upgradeTo` target — i.e. upgraded
 * variants. Derived from the registry so the draft/reward/shop pools can
 * exclude them: upgraded cards are only reachable by upgrading, never drafted.
 */
export const UPGRADE_TARGET_IDS: ReadonlySet<string> = new Set(
  defs.map((c) => c.upgradeTo).filter((id): id is string => id !== undefined),
);

/**
 * E2: cards that are EXTRA unlockable content (carry an `unlock` milestone id).
 * Derived from the registry so the draft pool can exclude them by default —
 * mirrors UPGRADE_TARGET_IDS. A fresh player (no unlocks) gets a pool with these
 * removed, byte-identical to pre-E2. They re-enter the pool only when their
 * milestone is earned and the id is in the run's allow set.
 */
export const UNLOCKABLE_CARD_IDS: ReadonlySet<string> = new Set(
  defs.filter((c) => c.unlock !== undefined).map((c) => c.id),
);

export const cards: Readonly<Record<string, CardDef>> = Object.fromEntries(
  defs.map((c) => [c.id, c]),
);
