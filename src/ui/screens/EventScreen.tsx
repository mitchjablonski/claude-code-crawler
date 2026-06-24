import { Box, Text, useInput } from 'ink';
import type {
  ContentRegistry,
  EventCheck,
  EventRequirement,
  GameAction,
  RunState,
  SimpleEventOutcome,
} from '../../engine/types.js';
import { eventRequirementMet } from '../../engine/types.js';
import { theme } from '../theme.js';

/** Human-readable noun for the field a requirement gates on. */
const CHECK_NOUN: Readonly<Record<EventCheck, string>> = {
  gold: 'gold',
  hp: 'HP',
  maxHp: 'max HP',
  relics: 'relics',
  deck: 'cards',
};

function requireReason(requires: EventRequirement): string {
  return `need ${requires.atLeast} ${CHECK_NOUN[requires.check]}`;
}

/** Format one applied outcome as a styled line. */
function outcomeLine(outcome: SimpleEventOutcome, content: ContentRegistry): {
  readonly text: string;
  readonly good: boolean;
} {
  switch (outcome.kind) {
    case 'gainGold':
      return { text: `+${outcome.amount} gold`, good: true };
    case 'loseGold':
      return { text: `-${outcome.amount} gold`, good: false };
    case 'loseHp':
      return { text: `-${outcome.amount} HP`, good: false };
    case 'gainMaxHp':
      return { text: `+${outcome.amount} max HP`, good: true };
    case 'gainCard': {
      const name = content.cards[outcome.cardId]?.name ?? outcome.cardId;
      return { text: `Added ${name} to your deck`, good: true };
    }
    case 'gainRelic': {
      const name = content.relics[outcome.relicId]?.name ?? outcome.relicId;
      return { text: `Acquired ${name}`, good: true };
    }
  }
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

  useInput((input, key) => {
    if (result) {
      if (input === '1' || key.return) dispatch({ type: 'continueEvent' });
      return;
    }
    const n = Number(input);
    if (Number.isInteger(n) && n >= 1 && n <= options.length) {
      const option = options[n - 1];
      if (option && eventRequirementMet(state, option.requires)) {
        dispatch({ type: 'chooseEventOption', index: n - 1 });
      }
    }
  });

  if (!def) return null;

  // ---- Result view ----
  if (result) {
    const header = result.rolled ? 'The dice come up...' : 'It is done.';
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color={theme.colors.title}>
          {def.name}
        </Text>
        <Box marginTop={1}>
          <Text color={theme.colors.accent}>{header}</Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          {result.applied.map((outcome, i) => {
            const line = outcomeLine(outcome, content);
            return (
              <Text key={i} color={line.good ? theme.colors.success : theme.colors.danger}>
                {line.good ? '+ ' : '- '}
                {line.text}
              </Text>
            );
          })}
        </Box>
        <Box marginTop={1}>
          <Text color={theme.colors.muted}>[1] Continue</Text>
        </Box>
      </Box>
    );
  }

  // ---- Option view ----
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color={theme.colors.title}>
        {def.name}
      </Text>
      <Box marginTop={1} width={theme.layout.contentWidth}>
        <Text wrap="wrap">{def.prompt}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        {options.map((option, i) => {
          const available = eventRequirementMet(state, option.requires);
          if (!available) {
            return (
              <Text key={i} color={theme.colors.muted}>
                [-] {option.label} ({option.requires ? requireReason(option.requires) : 'unavailable'})
              </Text>
            );
          }
          return (
            <Text key={i}>
              [{i + 1}] {option.label}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}
