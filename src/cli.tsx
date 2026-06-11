#!/usr/bin/env node
import path from 'node:path';
import { resolveConfig } from './config.js';

const rawCommand = process.argv[2];
const command = rawCommand?.startsWith('--') ? undefined : rawCommand;
const args = process.argv.slice(command === undefined ? 2 : 3);

async function main(): Promise<void> {
  const config = resolveConfig();
  const eventsDir = path.join(config.saveDir, 'events');

  switch (command) {
    case 'hook': {
      // Hot path inside Claude Code tool calls: no Ink/React imports here.
      const { readStdin, writeHookEvent } = await import('./events/hookWriter.js');
      const raw = await readStdin();
      writeHookEvent(args[0] ?? 'Unknown', raw, { eventsDir });
      return;
    }
    case 'init': {
      const { installHooks, removeHooks } = await import('./events/install.js');
      const remove = args.includes('--remove');
      try {
        const result = remove
          ? removeHooks(process.cwd())
          : installHooks(process.cwd());
        if (remove) {
          console.log(
            result.changed
              ? `Removed crawler hooks from ${result.settingsPath}`
              : 'No crawler hooks were installed.',
          );
        } else {
          console.log(
            result.changed
              ? `Installed crawler hooks into ${result.settingsPath}`
              : 'Crawler hooks already installed.',
          );
        }
      } catch (err) {
        console.error(`init failed: ${(err as Error).message}`);
        process.exitCode = 1;
      }
      return;
    }
    case 'doctor': {
      const [{ runDoctor }, { resolveClient }] = await Promise.all([
        import('./events/doctor.js'),
        import('./ai/resolve.js'),
      ]);
      const report = runDoctor(process.cwd(), eventsDir);
      for (const line of report.lines) console.log(line);
      const client = await resolveClient(config);
      console.log(
        `[ok] dungeon announcer backend: ${client?.name ?? 'static (no API key, claude CLI, or local model found)'}`,
      );
      process.exitCode = report.ok ? 0 : 1;
      return;
    }
    case 'play':
    case undefined: {
      const [{ render }, { createSaveStore }, { App }, { resolveClient }, { createDungeonAi }, fs, pathMod] =
        await Promise.all([
          import('ink'),
          import('./persistence/saves.js'),
          import('./ui/App.js'),
          import('./ai/resolve.js'),
          import('./ai/dungeonAi.js'),
          import('node:fs'),
          import('node:path'),
        ]);
      const store = createSaveStore(config.saveDir);
      const client = await resolveClient(config);
      const transcript = config.aiTranscript
        ? (entry: Readonly<Record<string, unknown>>) => {
            try {
              fs.default.appendFileSync(
                pathMod.default.join(config.saveDir, 'ai-transcript.jsonl'),
                `${JSON.stringify(entry)}\n`,
              );
            } catch {
              // Transcript is best-effort.
            }
          }
        : undefined;
      const ai = createDungeonAi({ client, budgetUsd: config.aiBudgetUsd, transcript });
      render(
        <App
          deps={{ store, seed: config.seed, eventsDir, snarkLevel: config.snarkLevel, ai }}
        />,
      );
      return;
    }
    default:
      console.error(
        `Unknown command: ${command}\nUsage: ccc [play|init [--remove]|doctor|hook <type>]`,
      );
      process.exitCode = 1;
  }
}

void main();
