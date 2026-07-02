import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { connectSaveStore } from './persistence.js';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('missing #root element');
const root = createRoot(rootEl);

// Composition root (the web mirror of cli.tsx): connect the save store BEFORE
// mounting so the shell hydrates synchronously — persisted settings, the
// Continue-your-delve save, and unlock-bearing meta are all there on first
// paint. Shared bridge when served by web:dev/web:serve; localStorage fallback
// (with a visible note) when hosted statically.
void connectSaveStore().then((store) => {
  root.render(
    <StrictMode>
      <App store={store} />
    </StrictMode>,
  );
});
