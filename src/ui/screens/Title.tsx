import { Box, Text, useApp, useInput } from 'ink';
import type { Difficulty, RunMode, SnarkLevel } from '../../config.js';
import { Screen } from '../components/Screen.js';
import { theme } from '../theme.js';

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

const RUN_MODE_LABEL: Readonly<Record<RunMode, string>> = {
  single: 'Single session',
  arc: 'Multi-act arc',
};

export function Title({
  hasSave,
  snark,
  difficulty,
  runMode,
  characterName,
  aiBackend,
  dailyDate,
  dailyBest,
  unlockedCount,
  unlockableTotal,
  unlockedNames,
  justUnlockedNames,
  onNew,
  onDaily,
  onContinue,
  onCycleSnark,
  onCycleDifficulty,
  onCycleRunMode,
  onCycleCharacter,
}: {
  readonly hasSave: boolean;
  readonly snark: SnarkLevel;
  readonly difficulty: Difficulty;
  readonly runMode: RunMode;
  readonly characterName: string;
  readonly aiBackend: string;
  /** E3: today's daily-challenge date (`YYYY-MM-DD`, UTC). */
  readonly dailyDate: string;
  /** E3: best recorded score for today's daily, if already played. */
  readonly dailyBest?: number;
  /** E2: count of EXTRA content ids unlocked so far. */
  readonly unlockedCount: number;
  /** E2: total unlockable extras across all milestones. */
  readonly unlockableTotal: number;
  /** E2: display names of unlocked extras (sorted). */
  readonly unlockedNames: readonly string[];
  /** E2: extras whose milestone was crossed in the just-finished run. */
  readonly justUnlockedNames: readonly string[];
  readonly onNew: () => void;
  readonly onDaily: () => void;
  readonly onContinue: () => void;
  readonly onCycleSnark: () => void;
  readonly onCycleDifficulty: () => void;
  readonly onCycleRunMode: () => void;
  readonly onCycleCharacter: () => void;
}) {
  const { exit } = useApp();
  useInput((input) => {
    if (input === 'n') onNew();
    else if (input === 't') onDaily();
    else if (input === 'c' && hasSave) onContinue();
    else if (input === 's') onCycleSnark();
    else if (input === 'd') onCycleDifficulty();
    else if (input === 'm') onCycleRunMode();
    else if (input === 'k') onCycleCharacter();
    else if (input === 'q') exit();
  });

  return (
    <Screen title="CLAUDE CODE CRAWLER" footer={`announcer: ${aiBackend}`}>
      <Text dimColor>A dungeon beneath your terminal.</Text>
      <Box marginTop={1} flexDirection="column">
        {hasSave && <Text>[c] Continue your delve</Text>}
        <Text>[n] New delve</Text>
        <Text>
          [t] Daily {dailyDate}
          {dailyBest !== undefined ? ` (best: ${dailyBest})` : ''}
        </Text>
        <Text>[k] Class: {characterName}</Text>
        <Text>[m] Mode: {RUN_MODE_LABEL[runMode]}</Text>
        <Text>[d] Difficulty: {DIFFICULTY_LABEL[difficulty]}</Text>
        <Text>[s] Snark: {SNARK_LABEL[snark]}</Text>
        <Text>[q] Quit</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        {justUnlockedNames.length > 0 && (
          <Text color={theme.colors.success} bold>
            NEW: {justUnlockedNames.join(', ')} unlocked!
          </Text>
        )}
        <Text color={theme.colors.accent}>
          Unlocks: {unlockedCount}/{unlockableTotal}
          {unlockedNames.length > 0 ? ` — ${unlockedNames.join(', ')}` : ''}
        </Text>
        {unlockedCount === 0 && (
          <Text dimColor>Win runs to unlock extra cards and relics.</Text>
        )}
      </Box>
    </Screen>
  );
}
