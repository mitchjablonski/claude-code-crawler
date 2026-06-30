import { describe, expect, it } from 'vitest';

/**
 * #76 color-cohesion lock. The `[N]` "press this key" selection marker is the
 * SAME concept everywhere — enemy targets, map paths, event options AND the card
 * tiles (combat hand / reward / shop) and rest/shop option rows — so it reads in
 * the one accent treatment (accent color + bold) on every screen. The combat
 * enemy-target marker is already locked by CombatScreen.targeting.test.tsx; this
 * file locks the card-tile side so the unified treatment can't silently drift
 * back to plain-bold. Ink/chalk strip ANSI off a TTY-less stdout, so we FORCE
 * color on BEFORE chalk loads and import everything fresh (own module registry
 * per test file, so this doesn't leak color into the plain-text tests).
 */
process.env.FORCE_COLOR = '1';

const { createElement: h } = await import('react');
const { render } = await import('ink-testing-library');
const { CardTile } = await import('./CardTile.js');
const { content } = await import('../../engine/content/index.js');

describe('CardTile [N] marker shares the accent selection treatment (#76)', () => {
  it('renders the marker in the accent color + bold (same as combat target markers)', () => {
    const card = Object.values(content.cards)[0]!;
    const { lastFrame } = render(h(CardTile, { marker: '[1]', card }));
    const frame = lastFrame() ?? '';
    // accent token = cyan (SGR 36) + bold (SGR 1): the `[1]` marker is emphasized.
    expect(frame).toMatch(/\[1m\x1b\[36m\[1\]/);
  });
});
