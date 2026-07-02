/**
 * A2 placeholder for every engine phase the web renderer doesn't draw yet
 * (combat/reward/shop/rest/event/victory/defeat). The run must NEVER crash on
 * entering these phases — the engine happily transitions; we render a clear,
 * labeled stub instead of a screen. This component is the swappable "stage"
 * seam: A2 replaces it with the real screens (and the art pass can later drop
 * a PixiJS/WebGL stage into the same slot).
 */
import type { ContentRegistry, Phase, RunState } from '@game/engine/types.js';
import { colors } from '../theme.js';
import * as ui from '../ui.js';
import { mutedText } from '../ui.js';

const PHASE_TITLE: Readonly<Record<Exclude<Phase, 'map'>, string>> = {
  combat: 'Combat',
  reward: 'Reward',
  shop: 'Shop',
  rest: 'Rest site',
  event: 'Event',
  victory: 'Victory',
  defeat: 'Defeat',
};

export function PhaseStub({
  state,
  content,
  onQuit,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly onQuit: () => void;
}) {
  const phase = state.phase as Exclude<Phase, 'map'>;
  const over = phase === 'victory' || phase === 'defeat';
  return (
    <section
      style={{ ...ui.panel, borderColor: over ? colors.title : colors.energy }}
      aria-label={`${phase} placeholder`}
    >
      <h2 style={ui.heading}>{PHASE_TITLE[phase] ?? phase}</h2>
      {phase === 'combat' && state.combat && (
        <div style={{ marginBottom: '0.75rem' }}>
          {state.combat.enemies.map((enemy, i) => (
            <p key={`${enemy.defId}-${i}`} style={{ margin: '0.15rem 0' }}>
              <span style={{ color: colors.danger }}>{enemy.name}</span>{' '}
              <span style={mutedText}>
                — HP {enemy.hp}/{enemy.maxHp}
              </span>
            </p>
          ))}
        </div>
      )}
      {phase === 'event' && state.event && (
        <p style={mutedText}>{content.events[state.event.eventId]?.name ?? 'A strange scene.'}</p>
      )}
      <p style={{ color: colors.title, fontWeight: 700 }}>
        {over
          ? phase === 'victory'
            ? 'The dungeon yields. You win this one.'
            : 'The dungeon wins this one.'
          : `${PHASE_TITLE[phase] ?? phase} — coming in A2`}
      </p>
      {!over && (
        <p style={mutedText}>
          The engine entered the '{phase}' phase; the browser renderer for this screen lands in
          increment A2. (Dev note: play this phase in the terminal client for now.)
        </p>
      )}
      <button
        type="button"
        style={{ ...ui.button, borderColor: colors.title, marginTop: '0.5rem' }}
        onClick={onQuit}
      >
        Back to the surface (title)
      </button>
    </section>
  );
}
