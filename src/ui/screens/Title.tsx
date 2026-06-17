import { Box, Text, useApp, useInput } from 'ink';
import type { Difficulty, SnarkLevel } from '../../config.js';

const SNARK_LABEL: Readonly<Record<SnarkLevel, string>> = {
  0: 'dry',
  1: 'wry',
  2: 'roast',
};

const DIFFICULTY_LABEL: Readonly<Record<Difficulty, string>> = {
  story: 'Story',
  normal: 'Normal',
  hard: 'Hard',
  nightmare: 'Nightmare',
};

export function Title({
  hasSave,
  snark,
  difficulty,
  aiBackend,
  onNew,
  onContinue,
  onCycleSnark,
  onCycleDifficulty,
}: {
  readonly hasSave: boolean;
  readonly snark: SnarkLevel;
  readonly difficulty: Difficulty;
  readonly aiBackend: string;
  readonly onNew: () => void;
  readonly onContinue: () => void;
  readonly onCycleSnark: () => void;
  readonly onCycleDifficulty: () => void;
}) {
  const { exit } = useApp();
  useInput((input) => {
    if (input === 'n') onNew();
    else if (input === 'c' && hasSave) onContinue();
    else if (input === 's') onCycleSnark();
    else if (input === 'd') onCycleDifficulty();
    else if (input === 'q') exit();
  });

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Text color="yellow" bold>
        CLAUDE CODE CRAWLER
      </Text>
      <Text dimColor>A dungeon beneath your terminal.</Text>
      <Box marginTop={1} flexDirection="column">
        {hasSave && <Text>[c] Continue your delve</Text>}
        <Text>[n] New delve</Text>
        <Text>[d] Difficulty: {DIFFICULTY_LABEL[difficulty]}</Text>
        <Text>[s] Snark: {SNARK_LABEL[snark]}</Text>
        <Text>[q] Quit</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>announcer: {aiBackend}</Text>
      </Box>
    </Box>
  );
}
