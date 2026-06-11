import os from 'node:os';
import path from 'node:path';

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
