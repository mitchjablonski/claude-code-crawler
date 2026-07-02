import { afterEach, describe, expect, it, vi } from 'vitest';
import { freshSeed, seedFromLocation } from './seed.js';

describe('seedFromLocation', () => {
  it('reads the ?seed= param', () => {
    expect(seedFromLocation('?seed=abc-123')).toBe('abc-123');
    expect(seedFromLocation('?foo=1&seed=xyz')).toBe('xyz');
  });

  it('returns null when absent or blank', () => {
    expect(seedFromLocation('')).toBeNull();
    expect(seedFromLocation('?foo=1')).toBeNull();
    expect(seedFromLocation('?seed=')).toBeNull();
    expect(seedFromLocation('?seed=%20')).toBeNull();
  });
});

describe('freshSeed', () => {
  afterEach(() => vi.restoreAllMocks());

  it('derives run-<time36>-<rand6> without Math.random', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used in game flow');
    });
    const seed = freshSeed(() => 1_750_000_000_000);
    expect(seed).toMatch(/^run-[0-9a-z]+-[0-9a-z]{6}$/);
    expect(seed.startsWith(`run-${(1_750_000_000_000).toString(36)}-`)).toBe(true);
  });

  it('uses the injected clock only at the boundary', () => {
    const now = vi.fn(() => 42);
    freshSeed(now);
    expect(now).toHaveBeenCalledTimes(1);
  });
});
