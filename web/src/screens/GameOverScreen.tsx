/**
 * Game-over screen (victory AND defeat): the web mirror of the terminal
 * GameOverScreen's run report — outcome banner, score (the shared pure
 * `runScore`), class, depth reached, final HP, deck size, gold, the per-run
 * stat line (turns/dealt/taken/slain), relics, and the seed. Keys: [n] new
 * delve, [t] back to title (both clickable). Phase B (shared saves): the
 * persistence-backed lines the terminal shows now render here too — the #28
 * personal-best chase (NEW BEST! vs Score · Best) and the #46 "NEW UNLOCKED"
 * fanfare. [q] quit has no browser analogue; the daily tag stays terminal-only
 * until the web grows a daily entry point.
 */
import type { ContentRegistry, RunState } from '@game/engine/types.js';
import { runScore } from '@game/progression/daily.js';
import { colors } from '../theme.js';
import { useKeys } from '../useKeys.js';
import * as ui from '../ui.js';
import { mutedText } from '../ui.js';

export function GameOverScreen({
  state,
  content,
  characterName,
  onNew,
  onTitle,
  priorBest,
  unlockedNames = [],
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly characterName: string;
  readonly onNew: () => void;
  readonly onTitle: () => void;
  /**
   * #28 mirror: personal best for this (character, mode) among PRIOR runs —
   * null when this is the first such run (reads as a NEW BEST), undefined when
   * there is no persistence (plain score line, exactly the A2 report).
   */
  readonly priorBest?: number | null;
  /** #46 mirror: display names of cross-run unlocks EARNED BY THIS RUN. */
  readonly unlockedNames?: readonly string[];
}) {
  const won = state.phase === 'victory';

  useKeys((key) => {
    if (key === 'n') onNew();
    else if (key === 't') onTitle();
  });

  const depth = state.map.nodes[state.currentNodeId]?.row ?? 0;
  const bossRow = state.map.nodes[state.map.bossId]?.row ?? depth;
  const relicNames = state.relics.map((id) => content.relics[id]?.name ?? id);
  const relics = relicNames.length > 0 ? relicNames.join(', ') : 'none';
  const score = runScore(state);

  return (
    <section
      style={{ ...ui.panel, borderColor: won ? colors.success : colors.danger }}
      aria-label="run over"
    >
      <h2 style={ui.heading}>{won ? 'Run Complete' : 'Run Ended'}</h2>
      <p style={{ color: won ? colors.success : colors.danger, fontWeight: 700 }}>
        {won ? 'THE SCOPE CREEP IS SLAIN' : 'YOU DIED'}
      </p>
      <p style={mutedText}>
        {won
          ? 'The dungeon grumbles and starts drafting new requirements.'
          : 'The dungeon thanks you for your engagement.'}
      </p>
      {priorBest === undefined ? (
        <p>
          <span style={{ color: colors.accent, fontWeight: 700 }}>Score {score}</span>
        </p>
      ) : priorBest === null || score > priorBest ? (
        // A run beats its personal best when there is no prior best (first such
        // run) or it strictly exceeds it — same rule as the terminal report.
        <p>
          <span style={{ color: colors.success, fontWeight: 700 }}>NEW BEST! {score}</span>
          {priorBest !== null && <span style={mutedText}> (prev {priorBest})</span>}
        </p>
      ) : (
        <p>
          <span style={{ color: colors.accent, fontWeight: 700 }}>Score {score}</span>
          <span style={mutedText}> · Best {priorBest}</span>
        </p>
      )}
      {unlockedNames.length > 0 && (
        <p style={{ color: colors.success, fontWeight: 700 }}>
          NEW UNLOCKED: {unlockedNames.join(', ')}
        </p>
      )}
      <div style={{ margin: '0.5rem 0' }}>
        <p style={{ margin: '0.15rem 0' }}>
          <span style={mutedText}>Class </span>
          <span style={{ color: colors.accent }}>{characterName}</span>
          <span style={mutedText}> Depth reached </span>
          <span style={{ color: colors.accent }}>
            {depth}/{bossRow}
          </span>
        </p>
        <p style={{ margin: '0.15rem 0' }}>
          <span style={mutedText}>Final HP </span>
          <span style={{ color: colors.hp }}>
            {state.hp}/{state.maxHp}
          </span>
        </p>
        <p style={{ margin: '0.15rem 0' }}>
          <span style={mutedText}>Deck </span>
          {state.deck.length} cards
          <span style={mutedText}> Gold </span>
          <span style={{ color: colors.gold }}>{state.gold}g</span>
        </p>
        <p style={{ margin: '0.15rem 0' }}>
          <span style={mutedText}>Turns </span>
          <span style={{ color: colors.accent }}>{state.stats.turns}</span>
          <span style={mutedText}> Dealt </span>
          <span style={{ color: colors.accent }}>{state.stats.damageDealt}</span>
          <span style={mutedText}> Taken </span>
          <span style={{ color: colors.hp }}>{state.stats.damageTaken}</span>
          <span style={mutedText}> Slain </span>
          <span style={{ color: colors.accent }}>{state.stats.enemiesSlain}</span>
        </p>
        <p style={{ margin: '0.15rem 0' }}>
          <span style={mutedText}>Relics </span>
          <span style={{ color: colors.accent }}>{relics}</span>
        </p>
        <p style={{ margin: '0.15rem 0' }}>
          <span style={mutedText}>Seed </span>
          {state.seed}
        </p>
      </div>
      <button type="button" style={{ ...ui.button, borderColor: colors.success }} onClick={onNew}>
        <span style={{ color: colors.success, fontWeight: 700 }}>[n] New delve</span>
      </button>
      <button type="button" style={ui.button} onClick={onTitle}>
        <span style={ui.keyHint}>[t]</span> Back to title
      </button>
      <p style={ui.footer}>[n] new delve · [t] title — or click</p>
    </section>
  );
}
