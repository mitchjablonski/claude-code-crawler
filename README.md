# Claude Code Crawler

[![CI](https://github.com/mitchjablonski/claude-code-crawler/actions/workflows/ci.yml/badge.svg)](https://github.com/mitchjablonski/claude-code-crawler/actions/workflows/ci.yml)

A roguelike deckbuilder that lives alongside [Claude Code](https://claude.com/claude-code) — crawl the dungeon while Claude works, and return to the surface when it needs you. Failing builds spawn elites named after your stack trace; passing tests rain gold; when Claude stops and waits for you, the dungeon kicks you back to the terminal.

> **Not affiliated with, endorsed by, or sponsored by Anthropic.** Claude and Claude Code are trademarks of Anthropic. This is a community project that integrates with Claude Code via its public hooks.

```
  ┌─ demo ──────────────────────────────────────────────┐
  │  (asciinema / GIF goes here — `ccc simulate          │
  │   busy-refactor` next to a live game)                │
  └──────────────────────────────────────────────────────┘
```

## Quickstart

```sh
npx claude-code-crawler            # play standalone, right now
```

To wire it into a real coding session:

```sh
npm i -g claude-code-crawler       # puts `ccc` and `crawler` on your PATH
cd your-project
ccc init                           # installs Claude Code hooks (merges, never clobbers)
crawler                            # run this in a second terminal pane
```

Now give Claude a task in one pane and crawl in the other. `ccc doctor` checks the wiring.

## How it works

Claude Code fires [hooks](https://docs.claude.com/en/docs/claude-code/hooks) as it works. `ccc init` installs small hook commands that append those events to a per-session log; the running game tails it and turns real activity into **bounded** game effects:

| Real event            | In the dungeon                              |
| --------------------- | ------------------------------------------- |
| Tests pass            | a purse of gold                             |
| Build / tests fail    | an elite is summoned, named after the cause |
| Claude spawns a sub-agent | a familiar grants +Strength next combat |
| Claude stops & waits  | **return to the surface** — the game pauses |
| deepPairing wants a review | the dungeon pings you to go judge it    |

The guiding rule is **LLM flavors, code decides**: the deterministic game engine owns all mechanics and balance (runs are seeded and replay byte-for-byte); the AI only ever writes flavor — narration lines and the names of things — and can never invent mechanics.

## The Dungeon AI

A snarky announcer narrates your run and christens the monsters your mistakes summon. It resolves a backend automatically, so **an API key is optional**:

1. `ANTHROPIC_API_KEY` → Claude Haiku directly (fastest)
2. the `claude` CLI on your PATH → narrates on your existing Claude Code login, no key needed
3. a local [Ollama](https://ollama.com) (or any OpenAI-compatible server) → fully offline
4. none of the above → hand-authored static flavor; the game is complete regardless

Snark is a setting (`[s]` on the title screen): **dry**, **wry**, or **roast**. It applies to the static lines too, so offline play still respects your taste.

## Plays nicely with deepPairing

`ccc init` merges its hooks alongside any you already have (it won't touch your existing config), and the game treats deepPairing review requests as a first-class "return to the surface" ping.

## Status

**v0.1 — playable and broadly built out.** Two character classes (Knight, Apothecary), 50 cards, 20 enemies (incl. 2 elites + a boss, tiered for act escalation), 12 relics, 10 events, plus Poison and Dexterity mechanics. Choose your run on the title screen:

- **Mode** (`[m]`): a session-sized **single** act, or a 3-act **arc**.
- **Difficulty** (`[d]`): Story / Normal / Hard / Nightmare — matched in win-rate across both modes.
- **Snark** (`[s]`) and **Class** (`[k]`).

Balance is validated by a headless playtest harness and an MCTS search bot, not by guesswork. Roadmap:

- an optional graphical renderer (terminal stays the default)
- more character classes and class-gated cards
- richer Dungeon AI authority (curating encounters, not just naming them)

Issues and PRs welcome.

## Development

```sh
npm install
npm test            # vitest (141 tests)
npm run lint        # includes the engine-purity layering rules
npm run typecheck
npm run dev         # run the TUI from source
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the architecture contract. Licensed MIT.
