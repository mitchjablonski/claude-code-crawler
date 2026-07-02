/**
 * Map screen: the numbered next-node choices, labeled EXACTLY as the terminal
 * MapScreen labels them (same strings: node-kind labels, named events with an
 * ` (event)` tag, `??? Unknown event (risk/reward)` for hiddenOnMap gambles,
 * the act-transition toll warning). Click a node or press its number; [v]
 * opens the deck overlay. Presentation + dispatch only — path legality, node
 * resolution, and all consequences stay in the engine reducer.
 *
 * The choice list lives in its own component region so the art pass can swap
 * in a rendered map stage without touching the dispatch wiring.
 */
import type { ContentRegistry, GameAction, MapNode, NodeKind, RunState } from '@game/engine/types.js';
import { ACT_TRANSITION_EXHAUSTION_HP } from '@game/engine/run.js';
import { colors } from '../theme.js';
import { useKeys } from '../useKeys.js';
import * as ui from '../ui.js';
import { mutedText } from '../ui.js';

// Mirrors the terminal MapScreen's labels verbatim (that module renders
// through Ink so it cannot be imported into the browser bundle; the STRINGS
// are the shared contract and are covered by tests here).
const KIND_LABEL: Readonly<Record<NodeKind, string>> = {
  start: 'Start',
  combat: 'Combat',
  elite: 'ELITE combat (harder, better loot)',
  event: 'Unknown event (risk/reward)',
  shop: 'Shop (spend gold)',
  rest: 'Rest site (heal or upgrade)',
  boss: 'THE BOSS',
};

const EVENT_TAG_REVEALED = ' (event)';
const EVENT_TAG_HIDDEN = ' (risk/reward)';

/**
 * #69 tiered reveal, same rule as the terminal: named events show their name,
 * `hiddenOnMap` gambles stay a "??? Unknown event" mystery (no name leak).
 */
export function nodeLabel(node: MapNode, content: ContentRegistry): string {
  if (node.kind !== 'event') return KIND_LABEL[node.kind];
  const def = node.eventId ? content.events[node.eventId] : undefined;
  if (!def) return KIND_LABEL.event;
  const name = def.hiddenOnMap ? '??? Unknown event' : def.name;
  const tag = def.hiddenOnMap ? EVENT_TAG_HIDDEN : EVENT_TAG_REVEALED;
  return `${name}${tag}`;
}

export function MapScreen({
  state,
  content,
  dispatch,
  onViewDeck,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly dispatch: (action: GameAction) => void;
  readonly onViewDeck: () => void;
}) {
  const node = state.map.nodes[state.currentNodeId];
  const options = (node?.next ?? [])
    .map((id) => state.map.nodes[id])
    .filter((n): n is MapNode => n !== undefined);
  const bossRow = state.map.nodes[state.map.bossId]?.row ?? 0;
  const crossesIntoNextAct = node !== undefined && options.some((o) => o.act > node.act);

  const choose = (index: number) => {
    const option = options[index];
    if (option) dispatch({ type: 'chooseNode', nodeId: option.id });
  };

  useKeys((key) => {
    if (key === 'v') {
      onViewDeck();
      return;
    }
    const n = Number(key);
    if (Number.isInteger(n) && n >= 1 && n <= options.length) choose(n - 1);
  });

  return (
    <section style={ui.panel} aria-label="the map">
      <h2 style={ui.heading}>
        The Map <span style={mutedText}>· Depth {node?.row ?? 0}/{bossRow}</span>
      </h2>
      <p style={{ fontWeight: 700 }}>The passage forks. Choose your path:</p>
      {crossesIntoNextAct && (
        <p style={{ color: colors.danger }}>
          The descent into the next act will take its toll: -{ACT_TRANSITION_EXHAUSTION_HP} max
          HP.
        </p>
      )}
      <div role="list" aria-label="paths">
        {options.map((option, i) => (
          <button
            key={option.id}
            type="button"
            role="listitem"
            style={ui.button}
            onClick={() => choose(i)}
          >
            <span style={ui.keyHint}>[{i + 1}]</span>{' '}
            <span style={{ color: colors.nodeKind[option.kind] }}>
              {nodeLabel(option, content)}
            </span>
          </button>
        ))}
      </div>
      <p style={ui.footer}>press a number to descend · [v] view deck — or click a path</p>
    </section>
  );
}
