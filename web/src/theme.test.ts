/**
 * The web theme must be a faithful CSS mirror of the terminal's semantic
 * tokens: same token names, values resolved through the SHARED palette (so the
 * renderers cannot drift apart).
 */
import { describe, expect, it } from 'vitest';
import { theme as sharedTheme, palette } from '@game/ui/theme.js';
import { background, colors, defaultFg, hpTintCss, status } from './theme.js';

const HEX = /^#[0-9a-f]{6}$/i;

describe('web theme tokens', () => {
  it('mirrors the scalar semantic tokens through the shared palette', () => {
    expect(colors.hp).toBe(palette[sharedTheme.colors.hp]);
    expect(colors.block).toBe(palette[sharedTheme.colors.block]);
    expect(colors.energy).toBe(palette[sharedTheme.colors.energy]);
    expect(colors.gold).toBe(palette[sharedTheme.colors.gold]);
    expect(colors.accent).toBe(palette[sharedTheme.colors.accent]);
    expect(colors.danger).toBe(palette[sharedTheme.colors.danger]);
    expect(colors.success).toBe(palette[sharedTheme.colors.success]);
    expect(colors.muted).toBe(palette[sharedTheme.colors.muted]);
    expect(colors.heat).toBe(palette[sharedTheme.colors.heat]);
  });

  it('keeps the same token names for every semantic map', () => {
    expect(Object.keys(colors.nodeKind)).toEqual(Object.keys(sharedTheme.colors.nodeKind));
    expect(Object.keys(colors.rarity)).toEqual(Object.keys(sharedTheme.colors.rarity));
    expect(Object.keys(colors.cardType)).toEqual(Object.keys(sharedTheme.colors.cardType));
    expect(Object.keys(colors.intent)).toEqual(Object.keys(sharedTheme.colors.intent));
    expect(Object.keys(status)).toEqual(Object.keys(sharedTheme.status));
  });

  it('resolves every mapped token to a CSS hex value', () => {
    for (const map of [colors.nodeKind, colors.rarity, colors.cardType, colors.intent]) {
      for (const value of Object.values(map)) expect(value).toMatch(HEX);
    }
    for (const s of Object.values(status)) expect(s.color).toMatch(HEX);
    expect(defaultFg).toMatch(HEX);
    expect(background).toMatch(HEX);
  });

  it('hpTintCss follows the terminal hp gradient thresholds', () => {
    expect(hpTintCss(70, 70)).toBe(colors.hpHealthy);
    expect(hpTintCss(30, 70)).toBe(colors.hpWarning);
    expect(hpTintCss(10, 70)).toBe(colors.hpCritical);
  });
});
