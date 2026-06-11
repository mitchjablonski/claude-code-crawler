import os from 'node:os';
import path from 'node:path';

export type SnarkLevel = 0 | 1 | 2;

export interface Config {
  readonly saveDir: string;
  readonly seed: string | undefined;
  readonly snarkLevel: SnarkLevel;
}

/** Injectable ambient sources; production callers pass nothing. */
export interface ConfigSources {
  readonly argv?: readonly string[];
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly homedir?: string;
}

/**
 * The ONLY place ambient configuration (argv, env, homedir) is ever read.
 * Precedence: CLI flags > env vars > defaults. Result is frozen (REQ-11).
 */
export function resolveConfig(sources: ConfigSources = {}): Config {
  const argv = sources.argv ?? process.argv.slice(2);
  const env = sources.env ?? process.env;
  const home = sources.homedir ?? os.homedir();
  const flags = parseFlags(argv);

  const saveDir =
    flags['save-dir'] ?? env['CCC_SAVE_DIR'] ?? path.join(home, '.claude-code-crawler');
  const seed = flags['seed'] ?? env['CCC_SEED'];
  const snarkRaw = Number(flags['snark'] ?? env['CCC_SNARK'] ?? '1');
  const snarkLevel: SnarkLevel = snarkRaw === 0 || snarkRaw === 2 ? snarkRaw : 1;

  return Object.freeze({ saveDir, seed, snarkLevel });
}

function parseFlags(argv: readonly string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg?.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      flags[arg.slice(2, eq)] = arg.slice(eq + 1);
    } else {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[arg.slice(2)] = next;
        i++;
      } else {
        flags[arg.slice(2)] = 'true';
      }
    }
  }
  return flags;
}
