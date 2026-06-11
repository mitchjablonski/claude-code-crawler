import { describe, expect, it } from 'vitest';
import { resolveConfig } from './config.js';

const base = { argv: [] as string[], env: {}, homedir: '/home/crawler' };

describe('resolveConfig', () => {
  it('falls back to defaults', () => {
    const config = resolveConfig(base);
    expect(config.saveDir).toBe('/home/crawler/.claude-code-crawler');
    expect(config.seed).toBeUndefined();
    expect(config.snarkLevel).toBe(1);
  });

  it('prefers flags over env over defaults', () => {
    const config = resolveConfig({
      argv: ['--save-dir', '/flag/dir', '--seed=flagseed'],
      env: { CCC_SAVE_DIR: '/env/dir', CCC_SEED: 'envseed', CCC_SNARK: '2' },
      homedir: '/home/crawler',
    });
    expect(config.saveDir).toBe('/flag/dir');
    expect(config.seed).toBe('flagseed');
    expect(config.snarkLevel).toBe(2); // env wins when no flag
  });

  it('clamps invalid snark levels to the default', () => {
    expect(resolveConfig({ ...base, env: { CCC_SNARK: '7' } }).snarkLevel).toBe(1);
    expect(resolveConfig({ ...base, env: { CCC_SNARK: 'spicy' } }).snarkLevel).toBe(1);
    expect(resolveConfig({ ...base, env: { CCC_SNARK: '0' } }).snarkLevel).toBe(0);
  });

  it('returns a frozen object', () => {
    expect(Object.isFrozen(resolveConfig(base))).toBe(true);
  });
});
