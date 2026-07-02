/**
 * Title screen: class select (all four classes, names + taglines from the
 * shared CHARACTERS registry), difficulty + mode selectors, and "New delve".
 * Everything is clickable AND drives with the terminal's hotkeys: [k] cycle
 * class, [d] difficulty, [m] mode, [n] new delve.
 */
import { CHARACTERS, CHARACTER_IDS } from '@game/engine/content/index.js';
import type { Difficulty, RunMode } from '@game/difficulty.js';
import { colors } from '../theme.js';
import { useKeys } from '../useKeys.js';
import * as ui from '../ui.js';
import { mutedText } from '../ui.js';

const DIFFICULTY_LABEL: Readonly<Record<Difficulty, string>> = {
  story: 'Story',
  normal: 'Normal',
  hard: 'Hard',
  nightmare: 'Nightmare',
};

const RUN_MODE_LABEL: Readonly<Record<RunMode, string>> = {
  single: 'Single session',
  arc: 'Multi-act arc',
};

export function TitleScreen({
  characterId,
  difficulty,
  runMode,
  seedLocked,
  onSelectCharacter,
  onCycleCharacter,
  onCycleDifficulty,
  onCycleRunMode,
  onNew,
}: {
  readonly characterId: string;
  readonly difficulty: Difficulty;
  readonly runMode: RunMode;
  /** True when a `?seed=` param pins the next run (shown so it's no surprise). */
  readonly seedLocked: string | null;
  readonly onSelectCharacter: (id: string) => void;
  readonly onCycleCharacter: () => void;
  readonly onCycleDifficulty: () => void;
  readonly onCycleRunMode: () => void;
  readonly onNew: () => void;
}) {
  useKeys((key) => {
    if (key === 'n') onNew();
    else if (key === 'k') onCycleCharacter();
    else if (key === 'd') onCycleDifficulty();
    else if (key === 'm') onCycleRunMode();
  });

  return (
    <div style={ui.page}>
      <h1 style={{ ...ui.heading, fontSize: '1.6rem', marginTop: '1rem' }}>
        CLAUDE CODE CRAWLER
      </h1>
      <p style={{ ...mutedText, marginTop: 0 }}>A dungeon beneath your terminal.</p>

      <section style={ui.panel} aria-label="your hero">
        <h2 style={ui.heading}>
          — Your hero — <span style={ui.keyHint}>[k]</span>{' '}
          <span style={mutedText}>cycles</span>
        </h2>
        {CHARACTER_IDS.map((id) => {
          const cls = CHARACTERS[id];
          if (!cls) return null;
          const selected = id === characterId;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              style={selected ? ui.selectedButton : ui.button}
              onClick={() => onSelectCharacter(id)}
            >
              <span style={{ color: colors.accent, fontWeight: 700 }}>
                {selected ? '> ' : '  '}
              </span>
              <span style={{ color: selected ? colors.accent : undefined, fontWeight: 700 }}>
                {cls.name}
              </span>
              <span style={mutedText}> — {cls.description}</span>
              <span style={{ color: colors.hp }}> {cls.maxHp} HP</span>
            </button>
          );
        })}
      </section>

      <section style={ui.panel} aria-label="run setup">
        <h2 style={ui.heading}>— Run setup —</h2>
        <button type="button" style={ui.button} onClick={onCycleDifficulty}>
          <span style={ui.keyHint}>[d]</span> Difficulty:{' '}
          <span style={{ color: colors.title }}>{DIFFICULTY_LABEL[difficulty]}</span>
        </button>
        <button type="button" style={ui.button} onClick={onCycleRunMode}>
          <span style={ui.keyHint}>[m]</span> Mode:{' '}
          <span style={{ color: colors.title }}>{RUN_MODE_LABEL[runMode]}</span>
        </button>
        {seedLocked !== null && (
          <p style={{ ...mutedText, margin: '0.25rem 0 0 0' }}>
            seed pinned by URL: <span style={{ color: colors.accent }}>{seedLocked}</span>
          </p>
        )}
      </section>

      <section style={{ ...ui.panel, borderColor: colors.success }} aria-label="start">
        <button
          type="button"
          style={{ ...ui.button, borderColor: colors.success, marginBottom: 0 }}
          onClick={onNew}
        >
          <span style={{ color: colors.success, fontWeight: 700 }}>[n] New delve</span>
        </button>
      </section>

      <p style={ui.footer}>
        [n] new delve · [k] class · [d] difficulty · [m] mode — or just click
      </p>
    </div>
  );
}
