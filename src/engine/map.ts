import type { Rng } from './rng.js';
import type { MapNode, NodeKind, RunMap } from './types.js';

export interface MapConfig {
  /** 0..1; longer expected sessions get the larger map. */
  readonly tempoHint?: number;
}

export const MIN_CHOICE_ROWS = 5;
export const MAX_CHOICE_ROWS = 6;
const LANES = 2;
const CROSSOVER_CHANCE = 0.35;

const KIND_WEIGHTS: readonly [NodeKind, number][] = [
  ['combat', 0.5],
  ['event', 0.2],
  ['elite', 0.15],
  ['shop', 0.1],
  ['rest', 0.05],
];

function rollKind(rng: Rng): NodeKind {
  let roll = rng.next();
  for (const [kind, weight] of KIND_WEIGHTS) {
    roll -= weight;
    if (roll < 0) return kind;
  }
  return 'combat';
}

export function generateMap(rng: Rng, config: MapConfig = {}): RunMap {
  const tempo = Math.min(1, Math.max(0, config.tempoHint ?? 0.5));
  const choiceRows =
    MIN_CHOICE_ROWS + Math.round(tempo * (MAX_CHOICE_ROWS - MIN_CHOICE_ROWS));

  const nodes: Record<string, MapNode> = {};
  const laneId = (row: number, lane: number) => `n${row}-${lane}`;

  const restRow = choiceRows + 1;
  const bossRow = choiceRows + 2;
  const restId = `n${restRow}-0`;
  const bossId = `n${bossRow}-0`;

  // Choice rows: two lanes, same-lane edge always (=> reachability by
  // construction), crossover edge sometimes (=> the choice matters).
  for (let row = 1; row <= choiceRows; row++) {
    for (let lane = 0; lane < LANES; lane++) {
      const kind: NodeKind = row === 1 ? 'combat' : rollKind(rng);
      const next: string[] = [];
      if (row < choiceRows) {
        next.push(laneId(row + 1, lane));
        if (rng.next() < CROSSOVER_CHANCE) next.push(laneId(row + 1, 1 - lane));
      } else {
        next.push(restId);
      }
      nodes[laneId(row, lane)] = { id: laneId(row, lane), kind, row, next };
    }
  }

  // Guarantee at least one shop so gold always has a sink. Any row>1 choice
  // node can be converted — restricting to combat nodes leaves rare seeds
  // with no candidates at all.
  const hasShop = Object.values(nodes).some((n) => n.kind === 'shop');
  if (!hasShop) {
    const all = Object.values(nodes).filter((n) => n.row > 1);
    const preferred = all.filter((n) => n.kind === 'combat' || n.kind === 'event');
    const candidates = preferred.length > 0 ? preferred : all;
    const chosen = rng.pick(candidates);
    nodes[chosen.id] = { ...chosen, kind: 'shop' };
  }

  nodes[restId] = { id: restId, kind: 'rest', row: restRow, next: [bossId] };
  nodes[bossId] = { id: bossId, kind: 'boss', row: bossRow, next: [] };

  const startId = 'n0-0';
  nodes[startId] = {
    id: startId,
    kind: 'start',
    row: 0,
    next: [laneId(1, 0), laneId(1, 1)],
  };

  return { nodes, startId, bossId };
}
