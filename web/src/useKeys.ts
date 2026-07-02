import { useEffect, useRef } from 'react';

/**
 * Keyboard seam: the web analogue of Ink's `useInput`. Each screen registers
 * its key handler while mounted, so the SAME hotkeys the terminal documents
 * ([n]/[k]/[d]/[m] on the Title, numbers + [v] on the Map) work in the browser
 * alongside the mouse. Modifier chords are ignored so browser shortcuts
 * (Ctrl+R and friends) pass through untouched.
 */
export function useKeys(handler: (key: string) => void): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      ref.current(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
