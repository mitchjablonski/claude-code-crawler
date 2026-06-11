import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { App } from './App.js';
import { createRun } from '../engine/run.js';
import { DEFAULT_RUN_CONFIG, content } from '../engine/content/index.js';
import type { MetaState, RunRecord, SaveStore } from '../persistence/saves.js';
import type { RunState } from '../engine/types.js';

function memoryStore() {
  let run: RunState | null = null;
  const runs: RunRecord[] = [];
  let saveCount = 0;
  const store: SaveStore = {
    loadRun: () => run,
    saveRun: (state) => {
      run = state;
      saveCount++;
    },
    clearRun: () => {
      run = null;
    },
    loadMeta: (): MetaState => ({ version: 1, runs }),
    recordRun: (record) => {
      runs.push(record);
    },
  };
  return {
    store,
    get saveCount() {
      return saveCount;
    },
    get runs() {
      return runs;
    },
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 25));

/** Render and wait one tick so useInput's effect has subscribed to stdin. */
async function renderApp(element: Parameters<typeof render>[0]) {
  const instance = render(element);
  await tick();
  return instance;
}

const deps = (mem: ReturnType<typeof memoryStore>) => ({
  store: mem.store,
  seed: 'ui-test',
  now: () => 0,
});

describe('App', () => {
  it('boots to the title; new run reaches the map and autosaves', async () => {
    const mem = memoryStore();
    const { lastFrame, stdin } = await renderApp(<App deps={deps(mem)} />);
    expect(lastFrame()).toContain('CLAUDE CODE CRAWLER');
    expect(lastFrame()).not.toContain('[c] Continue');

    stdin.write('n');
    await tick();
    expect(lastFrame()).toContain('Choose your path');
    expect(mem.saveCount).toBeGreaterThan(0);
  });

  it('walks into combat and plays a card', async () => {
    const mem = memoryStore();
    const { lastFrame, stdin } = await renderApp(<App deps={deps(mem)} />);
    stdin.write('n');
    await tick();
    stdin.write('1'); // row 1 is always combat
    await tick();
    expect(lastFrame()).toContain('EN 3/3');
    expect(lastFrame()).toContain('Your hand:');
    expect(lastFrame()).toContain('next:'); // enemy intent visible

    stdin.write('1'); // starter cards all cost 1; single enemy auto-targets
    await tick();
    expect(lastFrame()).toContain('EN 2/3');
  });

  it('offers continue when a save exists and resumes it', async () => {
    const mem = memoryStore();
    mem.store.saveRun(createRun(content, 'resume-me', DEFAULT_RUN_CONFIG));
    const { lastFrame, stdin } = await renderApp(<App deps={deps(mem)} />);
    expect(lastFrame()).toContain('[c] Continue');

    stdin.write('c');
    await tick();
    expect(lastFrame()).toContain('Choose your path');
  });
});
