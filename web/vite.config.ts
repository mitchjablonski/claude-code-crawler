import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webRoot, '..');
const repoSrc = path.join(repoRoot, 'src');

/**
 * KNOWN GOTCHA, solved here: the shared engine is authored in NodeNext ESM
 * style — TypeScript sources import each other with `./x.js` specifiers (the
 * COMPILED path), and no `.js` file exists next to the `.ts` sources. TypeScript
 * understands this natively; Vite/esbuild resolve specifiers against the real
 * filesystem, and for files OUTSIDE the web root Vite's built-in
 * "ts-importer may mean .ts" heuristic is not something we want to depend on.
 *
 * This tiny pre-resolver makes the mapping EXPLICIT and deterministic:
 *   - `@game/engine/run.js`  -> `<repo>/src/engine/run.ts`   (alias entry points)
 *   - `./rng.js` imported by `<repo>/src/engine/run.ts` -> `./rng.ts`
 *     (the engine's own internal relative imports)
 * Only fires when the target `.ts`/`.tsx` actually exists; otherwise defers to
 * Vite's normal resolution. Applies identically to dev, build, and vitest.
 */
function gameJsToTs(): Plugin {
  return {
    name: 'ccc:game-js-specifiers-to-ts',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.endsWith('.js')) return null;
      let abs: string | null = null;
      if (source.startsWith('@game/')) {
        abs = path.join(repoSrc, source.slice('@game/'.length));
      } else if (
        (source.startsWith('./') || source.startsWith('../')) &&
        importer !== undefined &&
        path.resolve(importer).startsWith(repoSrc + path.sep)
      ) {
        abs = path.resolve(path.dirname(importer), source);
      }
      if (abs === null) return null;
      const base = abs.slice(0, -'.js'.length);
      for (const candidate of [`${base}.ts`, `${base}.tsx`]) {
        if (fs.existsSync(candidate)) return candidate;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [gameJsToTs()],
  resolve: {
    // Belt-and-braces alias for any @game import the plugin declines (e.g. a
    // future extensionless import). Kept in lockstep with tsconfig `paths`.
    alias: { '@game': repoSrc },
  },
  server: {
    // The shared engine lives OUTSIDE the web root (one engine, two
    // renderers) — allow the dev server to serve the whole repo.
    fs: { allow: [repoRoot] },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
