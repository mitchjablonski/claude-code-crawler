/**
 * Generate docs/demo.gif by driving the real App through ink-testing-library,
 * capturing terminal frames, and encoding them with gifenc. Dev tool, not shipped.
 *   npm run gif
 */
import fs from 'node:fs';
import path from 'node:path';
import { render } from 'ink-testing-library';
import { createCanvas } from '@napi-rs/canvas';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;
import { App } from '../src/ui/App.js';
import type { MetaSettings, MetaState, RunRecord, SaveStore } from '../src/persistence/saves.js';
import type { RunState } from '../src/engine/types.js';
import type { HookRecord } from '../src/events/types.js';
import type { TailerOptions } from '../src/events/tailer.js';
import type { DungeonAi } from '../src/ai/dungeonAi.js';
import React from 'react';

// --- in-memory store + fake event source (same seams the tests use) ---
function memoryStore(): SaveStore {
  let run: RunState | null = null;
  const runs: RunRecord[] = [];
  let settings: MetaSettings = {};
  return {
    loadRun: () => (run ? { state: run, savedAt: 0 } : null),
    saveRun: (s) => {
      run = s;
    },
    clearRun: () => {
      run = null;
    },
    loadMeta: (): MetaState => ({ version: 1, runs, settings }),
    recordRun: (r) => {
      runs.push(r);
    },
    updateSettings: (s) => {
      settings = { ...settings, ...s };
    },
  };
}

let emit: (r: HookRecord) => void = () => {};
const createSource = (opts: TailerOptions) => {
  emit = (r) => opts.onRecord(r);
  return { start: () => {}, stop: () => {}, poll: () => {} };
};
const hook = (hookType: string, payload: Record<string, unknown> = {}): HookRecord => ({
  hookType,
  receivedAt: 't',
  payload,
});
const ai: DungeonAi = { backend: 'static', narrate: () => {}, christen: () => {}, spentUsd: () => 0 };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- ANSI -> colored spans ---
const COLORS: Record<number, string> = {
  31: '#ff6b6b',
  32: '#8bd55a',
  33: '#ffd166',
  34: '#6ea8fe',
  35: '#d98cff',
  36: '#56d4d4',
  37: '#e6e6e6',
  90: '#7a8290',
  39: '#cdd3de',
};
interface Span { text: string; color: string; dim: boolean; bold: boolean }
function parseLine(line: string): Span[] {
  const spans: Span[] = [];
  let color = '#cdd3de';
  let dim = false;
  let bold = false;
  const re = /\x1b\[([0-9;]*)m/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const push = (text: string) => {
    if (text) spans.push({ text, color, dim, bold });
  };
  while ((m = re.exec(line)) !== null) {
    push(line.slice(last, m.index));
    last = re.lastIndex;
    for (const codeStr of m[1]!.split(';')) {
      const code = Number(codeStr || '0');
      if (code === 0) {
        color = '#cdd3de';
        dim = false;
        bold = false;
      } else if (code === 1) bold = true;
      else if (code === 2) dim = true;
      else if (code === 22) {
        dim = false;
        bold = false;
      } else if (COLORS[code]) color = COLORS[code]!;
    }
  }
  push(line.slice(last));
  return spans;
}

// --- render one frame string to an RGBA canvas ---
const CELL_W = 9;
const CELL_H = 19;
const COLS = 76;
const ROWS = 22;
const PAD = 10;
const W = COLS * CELL_W + PAD * 2;
const H = ROWS * CELL_H + PAD * 2;

function renderFrame(frame: string): Uint8ClampedArray {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, W, H);
  ctx.font = '15px monospace';
  ctx.textBaseline = 'top';
  const lines = frame.split('\n').slice(0, ROWS);
  lines.forEach((line, row) => {
    let col = 0;
    for (const span of parseLine(line)) {
      ctx.globalAlpha = span.dim ? 0.55 : 1;
      ctx.font = `${span.bold ? 'bold ' : ''}15px monospace`;
      ctx.fillStyle = span.color;
      for (const ch of span.text) {
        if (ch !== ' ') ctx.fillText(ch, PAD + col * CELL_W, PAD + row * CELL_H);
        col++;
      }
    }
  });
  ctx.globalAlpha = 1;
  return ctx.getImageData(0, 0, W, H).data as unknown as Uint8ClampedArray;
}

// --- drive the demo + collect frames ---
async function main() {
  const store = memoryStore();
  const { lastFrame, stdin } = render(
    React.createElement(App, { deps: { store, seed: 'demo', createSource, ai, now: () => 0 } }),
  );
  await sleep(40);

  const frames: { frame: string; hold: number }[] = [];
  const snap = (hold = 1400) => frames.push({ frame: lastFrame() ?? '', hold });

  snap(2200); // title (modes / class / difficulty / snark)
  stdin.write('n');
  await sleep(40);
  snap(1700); // map: choose your path
  stdin.write('1');
  await sleep(40);
  snap(1900); // combat: hand + enemy intent
  stdin.write('1');
  await sleep(40);
  snap(1500); // after playing a card (energy/enemy change)
  emit(hook('PostToolUse', { tool_name: 'Bash', tool_input: { command: 'npm test' }, tool_response: { exitCode: 0 } }));
  await sleep(40);
  snap(2200); // dungeon: linked + narration + gold from the passing test
  emit(hook('Stop'));
  await sleep(40);
  snap(2600); // CLAUDE AWAITS YOUR COMMAND — return to the surface

  // --- encode ---
  const gif = GIFEncoder();
  for (const { frame, hold } of frames) {
    const rgba = renderFrame(frame);
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, W, H, { palette, delay: hold });
  }
  gif.finish();
  const out = path.join('docs', 'demo.gif');
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync(out, gif.bytes());
  console.log(`wrote ${out} (${frames.length} frames, ${W}x${H}, ${gif.bytes().length} bytes)`);
  process.exit(0);
}

void main();
