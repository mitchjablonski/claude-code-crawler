import os from 'node:os';
import path from 'node:path';
import { DIFFICULTIES, RUN_MODES, type Difficulty, type RunMode } from './difficulty.js';

// Difficulty / run-mode knobs live in the PURE `difficulty.ts` module (Web A1)
// so the browser client can import them without pulling in the Node builtins
// this module reads. Re-exported here so every existing import site
// (`from './config.js'`) keeps working unchanged.
export {
  DIFFICULTIES,
  DEFAULT_DIFFICULTY,
  RUN_MODES,
  DEFAULT_RUN_MODE,
  ARC_ACTS,
  actsForMode,
  DIFFICULTY_KNOBS,
  knobsFor,
} from './difficulty.js';
export type { Difficulty, RunMode, DifficultyKnobs } from './difficulty.js';

export type SnarkLevel = 0 | 1 | 2;
export type AiProvider = 'anthropic' | 'claude-cli' | 'openai-compat' | 'static';

export interface Config {
  readonly saveDir: string;
  readonly seed: string | undefined;
  /** Explicit flag/env snark; undefined → fall back to the in-game setting, then wry. */
  readonly snarkLevel: SnarkLevel | undefined;
  readonly apiKey: string | undefined;
  /** Explicit backend choice; undefined → auto-resolve the provider ladder. */
  readonly aiProvider: AiProvider | undefined;
  readonly aiBaseUrl: string | undefined;
  readonly aiModel: string | undefined;
  readonly aiBudgetUsd: number;
  readonly aiTranscript: boolean;
  /** Hours before an unfinished run retires as abandoned (REQ-12). */
  readonly runTtlHours: number;
  /** Explicit flag/env difficulty; undefined → in-game setting, then Normal. */
  readonly difficulty: Difficulty | undefined;
  /** Explicit flag/env run mode; undefined → in-game setting, then single. */
  readonly runMode: RunMode | undefined;
  /** Explicit flag/env character id (validated by the UI); undefined → setting, then default. */
  readonly character: string | undefined;
}

/** Injectable ambient sources; production callers pass nothing. */
export interface ConfigSources {
  readonly argv?: readonly string[];
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly homedir?: string;
}

const AI_PROVIDERS: readonly AiProvider[] = ['anthropic', 'claude-cli', 'openai-compat', 'static'];

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

  const snarkRaw = flags['snark'] ?? env['CCC_SNARK'];
  const snarkNum = snarkRaw === undefined ? undefined : Number(snarkRaw);
  const snarkLevel: SnarkLevel | undefined =
    snarkNum === 0 || snarkNum === 1 || snarkNum === 2 ? snarkNum : undefined;

  const apiKey = flags['api-key'] ?? env['CCC_API_KEY'] ?? env['ANTHROPIC_API_KEY'];

  const providerRaw = flags['ai-provider'] ?? env['CCC_AI_PROVIDER'];
  const aiProvider = AI_PROVIDERS.includes(providerRaw as AiProvider)
    ? (providerRaw as AiProvider)
    : undefined;

  const aiBaseUrl = flags['ai-base-url'] ?? env['CCC_AI_BASE_URL'];
  const aiModel = flags['ai-model'] ?? env['CCC_AI_MODEL'];

  const budgetRaw = Number(flags['ai-budget'] ?? env['CCC_AI_BUDGET'] ?? '0.05');
  const aiBudgetUsd = Number.isFinite(budgetRaw) && budgetRaw >= 0 ? budgetRaw : 0.05;

  const transcriptRaw = flags['ai-transcript'] ?? env['CCC_AI_TRANSCRIPT'];
  const aiTranscript = transcriptRaw === 'true' || transcriptRaw === '1';

  const ttlRaw = Number(flags['run-ttl-hours'] ?? env['CCC_RUN_TTL_HOURS'] ?? '24');
  const runTtlHours = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : 24;

  const difficultyRaw = flags['difficulty'] ?? env['CCC_DIFFICULTY'];
  const difficulty = DIFFICULTIES.includes(difficultyRaw as Difficulty)
    ? (difficultyRaw as Difficulty)
    : undefined;

  const modeRaw = flags['mode'] ?? env['CCC_MODE'];
  const runMode = RUN_MODES.includes(modeRaw as RunMode) ? (modeRaw as RunMode) : undefined;

  // Character id is validated against the content registry by the UI layer.
  const character = flags['character'] ?? env['CCC_CHARACTER'];

  return Object.freeze({
    saveDir,
    seed,
    snarkLevel,
    apiKey,
    aiProvider,
    aiBaseUrl,
    aiModel,
    aiBudgetUsd,
    aiTranscript,
    runTtlHours,
    difficulty,
    runMode,
    character,
  });
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
