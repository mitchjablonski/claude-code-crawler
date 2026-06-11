# Claude Code Crawler

A roguelike deckbuilder that lives alongside [Claude Code](https://claude.com/claude-code) — crawl the dungeon while Claude works, and return to the surface when it needs you. Tone: classic fantasy dungeon crawl with an irreverent, darkly comic announcer.

**Status: pre-alpha, Milestone 1 (engine core) in progress.**

## How it will work

- Run `crawler` (or `ccc`) in a pane next to Claude Code.
- `ccc init` installs Claude Code hooks; real coding events (tests passing, builds failing, agents spawning) trigger *bounded* in-game effects — a failed build spawns a themed elite, a passing test grants a loot roll.
- When Claude needs you, the Dungeon AI pauses the run and sends you back to the surface.
- A micro-LLM (Haiku) narrates with configurable snark. **LLM flavors, code decides:** the model never invents mechanics, and the game is fully playable with no hooks and no API key.

## Architecture contract

`src/engine/` is pure and deterministic: no IO, no wall clock, no `Math.random`, no imports from any other layer. This is enforced by ESLint, not convention. Everything else (UI, hook events, modifiers, AI, persistence) layers on top and drives the engine exclusively through `applyAction`.

## Development

```sh
npm install
npm test          # vitest
npm run lint      # includes the engine-purity layering rules
npm run typecheck
npm run dev       # run the TUI from source
```
