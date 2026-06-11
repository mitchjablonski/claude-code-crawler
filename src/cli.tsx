#!/usr/bin/env node
import { render } from 'ink';
import { resolveConfig } from './config.js';
import { createSaveStore } from './persistence/saves.js';
import { App } from './ui/App.js';

const config = resolveConfig();
const store = createSaveStore(config.saveDir);

render(<App deps={{ store, seed: config.seed }} />);
