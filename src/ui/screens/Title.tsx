import { Box, Text, useApp, useInput } from 'ink';

export function Title({
  hasSave,
  onNew,
  onContinue,
}: {
  readonly hasSave: boolean;
  readonly onNew: () => void;
  readonly onContinue: () => void;
}) {
  const { exit } = useApp();
  useInput((input) => {
    if (input === 'n') onNew();
    else if (input === 'c' && hasSave) onContinue();
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
        <Text>[q] Quit</Text>
      </Box>
    </Box>
  );
}
