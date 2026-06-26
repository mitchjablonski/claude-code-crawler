import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // scripts/** holds dev-harness tooling (not shipped); its unit tests live
    // alongside it (e.g. the #39 draft scorer) so they run in the same suite.
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
  },
});
