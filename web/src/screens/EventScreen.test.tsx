/**
 * Event screen tests: real engine event states; options with stakes hints,
 * gated options muted with the inline reason, result view + continue.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { content } from '@game/engine/content/index.js';
import { eventRequirementMet } from '@game/engine/types.js';
import type { RunState } from '@game/engine/types.js';
import { App } from '../App.js';
import { findPhase } from '../testkit.js';
import { optionHintSegments, requireReason } from '../eventHints.js';

afterEach(cleanup);
const press = (key: string) => fireEvent.keyDown(window, { key });
const mount = (state: RunState) => render(<App locationSearch="" initialState={state} />);

describe('EventScreen', () => {
  it('renders the event prompt and its options', () => {
    const { state } = findPhase('web-a2-event', 'event');
    const def = content.events[state.event!.eventId]!;
    mount(state);
    const panel = screen.getByLabelText('event');
    expect(panel.textContent).toContain(def.name);
    expect(panel.textContent).toContain(def.prompt);
    const rows = within(screen.getByRole('list', { name: 'event options' })).getAllByRole('listitem');
    expect(rows).toHaveLength(def.options.length);
    def.options.forEach((option, i) => {
      expect(rows[i]!.textContent).toContain(option.label);
    });
  });

  it('choosing an option shows the result view; continue returns to the map', () => {
    const { state } = findPhase('web-a2-event', 'event');
    const def = content.events[state.event!.eventId]!;
    const index = def.options.findIndex((o) => eventRequirementMet(state, o.requires));
    expect(index).toBeGreaterThanOrEqual(0);
    mount(state);
    fireEvent.click(
      within(screen.getByRole('list', { name: 'event options' })).getAllByRole('listitem')[index]!,
    );
    const result = screen.getByLabelText('event result');
    // #50 echo + the roll/deterministic header.
    expect(result.textContent).toContain(`You chose: ${def.options[index]!.label}`);
    expect(result.textContent).toMatch(/The dice come up\.\.\.|It is done\./);
    press('1');
    expect(screen.getByLabelText('the map')).toBeTruthy();
  });

  it('mutes a gated option with the inline reason and guards its input', () => {
    // A REAL event def with a requirement, mounted as the live event with the
    // player resource forced below the gate (presentation-only tweak — every
    // dispatch still runs through the real reducer, which re-validates).
    const gated = Object.values(content.events).find((e) =>
      e.options.some((o) => o.requires !== undefined),
    );
    expect(gated).toBeDefined();
    const optIndex = gated!.options.findIndex((o) => o.requires !== undefined);
    const requires = gated!.options[optIndex]!.requires!;
    const { state } = findPhase('web-a2-event', 'event');
    const starved: RunState = {
      ...state,
      event: { eventId: gated!.id },
      gold: requires.check === 'gold' ? requires.atLeast - 1 : state.gold,
      hp: requires.check === 'hp' ? Math.max(1, requires.atLeast - 1) : state.hp,
      maxHp: requires.check === 'maxHp' ? requires.atLeast - 1 : state.maxHp,
      relics: requires.check === 'relics' ? [] : state.relics,
      deck: requires.check === 'deck' ? state.deck.slice(0, requires.atLeast - 1) : state.deck,
    };
    expect(eventRequirementMet(starved, requires)).toBe(false);
    mount(starved);
    const rows = within(screen.getByRole('list', { name: 'event options' })).getAllByRole('listitem');
    const row = rows[optIndex]!;
    expect(row.getAttribute('aria-disabled')).toBe('true');
    expect(row.textContent).toContain(`(${requireReason(requires)})`);
    // Clicking the locked row is a guarded no-op: still on the option view.
    fireEvent.click(row);
    expect(screen.getByLabelText('event')).toBeTruthy();
  });

  it('shows a stakes hint under options that carry outcomes', () => {
    const hintedIndex = (s: RunState): number => {
      const def = content.events[s.event!.eventId]!;
      return def.options.findIndex(
        (o) => optionHintSegments(o.outcomes, content, s.eventLoseHpMult).length > 0,
      );
    };
    const { state } = findPhase('web-a2-event-hint', 'event', (s) => hintedIndex(s) >= 0, {
      seeds: 80,
    });
    const def = content.events[state.event!.eventId]!;
    const index = hintedIndex(state);
    const segments = optionHintSegments(def.options[index]!.outcomes, content, state.eventLoseHpMult);
    mount(state);
    const rows = within(screen.getByRole('list', { name: 'event options' })).getAllByRole('listitem');
    // Every hint segment renders in the option's sub-line (stakes, not rolls).
    expect(rows[index]!.textContent).toContain(segments.map((seg) => seg.text).join(''));
  });
});
