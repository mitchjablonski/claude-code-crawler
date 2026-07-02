/**
 * nodeLabel: the web map's labels must match the terminal's labeling contract —
 * especially #69 tiered reveal: hiddenOnMap gambles NEVER leak their name.
 */
import { describe, expect, it } from 'vitest';
import { content } from '@game/engine/content/index.js';
import type { MapNode } from '@game/engine/types.js';
import { nodeLabel } from './MapScreen.js';

const node = (kind: MapNode['kind'], eventId?: string): MapNode => ({
  id: 'n1',
  kind,
  row: 1,
  act: 0,
  next: [],
  ...(eventId !== undefined ? { eventId } : {}),
});

describe('nodeLabel', () => {
  it('labels non-event nodes with the terminal strings', () => {
    expect(nodeLabel(node('combat'), content)).toBe('Combat');
    expect(nodeLabel(node('elite'), content)).toBe('ELITE combat (harder, better loot)');
    expect(nodeLabel(node('shop'), content)).toBe('Shop (spend gold)');
    expect(nodeLabel(node('rest'), content)).toBe('Rest site (heal or upgrade)');
    expect(nodeLabel(node('boss'), content)).toBe('THE BOSS');
  });

  it('names revealed events with the (event) tag', () => {
    const revealed = Object.values(content.events).find((e) => !e.hiddenOnMap);
    expect(revealed).toBeDefined();
    const label = nodeLabel(node('event', revealed!.id), content);
    expect(label).toBe(`${revealed!.name} (event)`);
  });

  it('keeps hiddenOnMap events a ??? mystery with no name leak', () => {
    const hidden = Object.values(content.events).filter((e) => e.hiddenOnMap === true);
    expect(hidden.length).toBeGreaterThan(0);
    for (const def of hidden) {
      const label = nodeLabel(node('event', def.id), content);
      expect(label).toBe('??? Unknown event (risk/reward)');
      expect(label).not.toContain(def.name);
    }
  });

  it('falls back to the generic label when the eventId is missing', () => {
    expect(nodeLabel(node('event'), content)).toBe('Unknown event (risk/reward)');
  });
});
