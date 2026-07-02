/**
 * Tiny shared style primitives for the A1 placeholder look: text-first panels
 * on the semantic theme tokens. Deliberately minimal — the combat/scene areas
 * are structured as swappable components so a PixiJS/WebGL stage can replace
 * these at the art pass without touching the shell.
 */
import type { CSSProperties } from 'react';
import { background, colors, defaultFg } from './theme.js';

export const page: CSSProperties = {
  minHeight: '100vh',
  margin: 0,
  padding: '1.5rem',
  boxSizing: 'border-box',
  background,
  color: defaultFg,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

export const panel: CSSProperties = {
  width: 'min(46rem, 100%)',
  border: `1px solid ${colors.muted}`,
  borderRadius: '8px',
  padding: '1rem 1.25rem',
  marginBottom: '1rem',
  background: 'rgba(255, 255, 255, 0.02)',
};

export const heading: CSSProperties = {
  color: colors.title,
  fontSize: '1.1rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  margin: '0 0 0.75rem 0',
  textTransform: 'uppercase',
};

/** Base button: text-first, inherits the mono font, themed border. */
export const button: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  font: 'inherit',
  color: defaultFg,
  background: 'transparent',
  border: `1px solid ${colors.muted}`,
  borderRadius: '6px',
  padding: '0.5rem 0.75rem',
  marginBottom: '0.5rem',
  cursor: 'pointer',
};

export const selectedButton: CSSProperties = {
  ...button,
  border: `1px solid ${colors.accent}`,
  boxShadow: `inset 0 0 0 1px ${colors.accent}`,
};

export const keyHint: CSSProperties = {
  color: colors.accent,
  fontWeight: 700,
};

export const mutedText: CSSProperties = {
  color: colors.muted,
};

export const footer: CSSProperties = {
  color: colors.muted,
  fontSize: '0.85rem',
  marginTop: '0.5rem',
};
