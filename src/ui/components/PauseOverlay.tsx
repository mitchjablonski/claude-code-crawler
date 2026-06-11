import { Box, Text, useInput } from 'ink';
import type { PauseState } from '../useEvents.js';

const COPY: Record<PauseState['reason'], { title: string; body: string }> = {
  awaits: {
    title: 'CLAUDE AWAITS YOUR COMMAND',
    body: 'The dungeon grinds to a halt. Somewhere above, a terminal blinks expectantly at an empty chair.',
  },
  notification: {
    title: 'ATTENTION REQUIRED ON THE SURFACE',
    body: 'A messenger imp materializes, clears its throat, and unrolls a scroll.',
  },
  review: {
    title: 'YOUR PAIR PARTNER AWAITS JUDGMENT',
    body: 'deepPairing has presented work for your review. The dungeon respects code review. Barely.',
  },
};

export function PauseOverlay({
  pause,
  onDismiss,
}: {
  readonly pause: PauseState;
  readonly onDismiss: () => void;
}) {
  useInput((input, key) => {
    if (key.return || input === 'p') onDismiss();
  });

  const copy = COPY[pause.reason];
  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Text bold color="yellow">
        {copy.title}
      </Text>
      <Box marginTop={1} width={76}>
        <Text wrap="wrap">{copy.body}</Text>
      </Box>
      {pause.detail !== undefined && (
        <Box marginTop={1} width={76}>
          <Text dimColor wrap="wrap">
            {pause.detail}
          </Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text>
          {pause.claudeActive
            ? 'Claude is working again - [enter] descend'
            : 'Go handle it, crawler. [p] keep playing anyway'}
        </Text>
      </Box>
    </Box>
  );
}
