/**
 * Event screen: the web mirror of the terminal EventScreen. Option view shows
 * the prompt, each option with its stakes hint (dim sub-line; ranges for a
 * gamble, never the resolved roll), and gated options muted with the inline
 * `(need N <thing>)` reason (click/key no-ops, engine re-validates anyway).
 * Result view echoes `You chose: <label>`, lists the applied outcomes colored
 * by gain/loss, closes with the aftermath flavor, and `[1] Continue to map`
 * (key: 1 or Enter). Keys: number = choose.
 */
import { useRef } from 'react';
import type { ContentRegistry, GameAction, RunState } from '@game/engine/types.js';
import { eventRequirementMet } from '@game/engine/types.js';
import { colors } from '../theme.js';
import {
  aftermathLine,
  optionHintSegments,
  outcomeLine,
  requireReason,
  type HintSegment,
} from '../eventHints.js';
import { useKeys } from '../useKeys.js';
import * as ui from '../ui.js';
import { mutedText } from '../ui.js';

function HintLine({ segments }: { readonly segments: readonly HintSegment[] }) {
  return (
    <span style={{ display: 'block', paddingLeft: '1.75rem', opacity: 0.85 }}>
      {segments.map((seg, i) => (
        <span key={i} style={{ color: seg.color }}>
          {seg.text}
        </span>
      ))}
    </span>
  );
}

export function EventScreen({
  state,
  content,
  dispatch,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly dispatch: (action: GameAction) => void;
}) {
  const def = state.event ? content.events[state.event.eventId] : undefined;
  const options = def?.options ?? [];
  const result = state.event?.result;

  // #50 (UI-only): remember which option was pressed so the result view can
  // echo `You chose: <label>`. Component-local, keyed by eventId (never stale).
  const chosen = useRef<{ readonly eventId: string; readonly index: number } | null>(null);

  const continueEvent = () => {
    chosen.current = null;
    dispatch({ type: 'continueEvent' });
  };
  const choose = (index: number) => {
    const option = options[index];
    if (option && eventRequirementMet(state, option.requires) && state.event) {
      chosen.current = { eventId: state.event.eventId, index };
      dispatch({ type: 'chooseEventOption', index });
    }
  };

  useKeys((key) => {
    if (result) {
      if (key === '1' || key === 'Enter') continueEvent();
      return;
    }
    const n = Number(key);
    if (Number.isInteger(n) && n >= 1 && n <= options.length) choose(n - 1);
  });

  if (!def) return null;

  // ---- Result view ----
  if (result) {
    const header = result.rolled ? 'The dice come up...' : 'It is done.';
    const aftermath = aftermathLine(def, result.applied);
    const chosenLabel =
      chosen.current && chosen.current.eventId === state.event?.eventId
        ? def.options[chosen.current.index]?.label
        : undefined;
    return (
      <section style={{ ...ui.panel, borderColor: colors.accent }} aria-label="event result">
        <h2 style={ui.heading}>{def.name}</h2>
        {chosenLabel !== undefined && <p style={mutedText}>You chose: {chosenLabel}</p>}
        <p style={{ color: colors.accent }}>{header}</p>
        <div style={{ margin: '0.5rem 0' }}>
          {result.applied.map((outcome, i) => {
            const line = outcomeLine(outcome, content);
            return (
              <p
                key={i}
                style={{ color: line.good ? colors.success : colors.danger, margin: '0.15rem 0' }}
              >
                {line.text}
              </p>
            );
          })}
        </div>
        <p style={{ ...mutedText, fontStyle: 'italic' }}>{aftermath}</p>
        <button type="button" style={{ ...ui.button, marginTop: '0.5rem' }} onClick={continueEvent}>
          <span style={ui.keyHint}>[1]</span> Continue to map
        </button>
        <p style={ui.footer}>[1] Continue to map</p>
      </section>
    );
  }

  // ---- Option view ----
  return (
    <section style={{ ...ui.panel, borderColor: colors.accent }} aria-label="event">
      <h2 style={ui.heading}>{def.name}</h2>
      <p>{def.prompt}</p>
      <div role="list" aria-label="event options">
        {options.map((option, i) => {
          const available = eventRequirementMet(state, option.requires);
          const hint = optionHintSegments(option.outcomes, content, state.eventLoseHpMult);
          return (
            <button
              key={i}
              type="button"
              role="listitem"
              aria-disabled={!available}
              style={{ ...ui.button, cursor: available ? 'pointer' : 'not-allowed' }}
              onClick={() => choose(i)}
            >
              {available ? (
                <>
                  <span style={ui.keyHint}>[{i + 1}]</span> {option.label}
                </>
              ) : (
                <span style={mutedText}>
                  [{i + 1}] {option.label} (
                  {option.requires ? requireReason(option.requires) : 'unavailable'})
                </span>
              )}
              {hint.length > 0 && <HintLine segments={hint} />}
            </button>
          );
        })}
      </div>
      <p style={ui.footer}>press a number to choose — or click</p>
    </section>
  );
}
