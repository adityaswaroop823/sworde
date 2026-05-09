# Sworde

> Open source Claude desktop. Sign in with your Claude subscription.
> Your data stays local.

Sworde is a beautiful desktop client built on top of Anthropic's official
**Claude Agent SDK**. It uses the same authentication as Claude Code — so if
you've run `claude login` once, sworde just works with your existing Pro / Max
subscription. No extra billing, no API key paste, nothing.

Falling back to a pay-per-use API key is supported too.

**Status:** Day 1 — auth + streaming chat working end-to-end. Skills, MCP,
hooks, tool-use rendering, and conversation persistence land over the next two
weeks.

## How auth works

When sworde launches it probes the Agent SDK:

1. **Found a `claude login` session?** → Use it. You're paying through your
   Claude subscription. Done.
2. **Found a saved API key?** → Use it. Anthropic bills you per token.
3. **Neither?** → Show a one-screen onboarding with two buttons:
   - **Sign in with Claude** — opens Terminal so you can run `claude login`,
     then click "Recheck — I just signed in"
   - **Use an API key** — paste once, stored locally (and only locally)

Sworde never sees, stores, or transmits credentials anywhere except directly to
Anthropic.

## Stack

- Electron + electron-vite
- React 18 + TypeScript
- Tailwind CSS (claude.ai-inspired warm cream palette)
- `@anthropic-ai/claude-agent-sdk` — same SDK Claude Code uses
- `electron-store` for local config

## Get started

You'll need:

- Node 18+
- Either a `claude` CLI logged in, or an Anthropic API key

```bash
cd ~/sworde
npm install
npm run dev
```

## Build for distribution

```bash
npm run build:mac     # produces a .dmg in release/
npm run build:win     # produces a Windows installer
npm run build:linux   # produces an AppImage
```

## What you get out of the box

Because sworde rides on the Claude Agent SDK, it inherits everything Claude
Code can do:

- File read / write / edit
- Bash execution with permission prompts
- Grep / Glob / file search
- MCP server support
- Subagents (Agent tool)
- Hooks
- Streaming responses
- Image / PDF reading
- Web fetch / search
- Auto-compaction on long sessions

The work in sworde is the **shell** — turning that engine into a native
desktop experience with proper Cmd+A/Cmd+C, markdown rendering, drag-drop,
multi-chat sidebar, and a calm visual design.

## Roadmap

- [x] Day 1 — Electron shell, auth probe, claude.ai vibe, streaming chat
- [ ] Day 2 — Conversation persistence (sqlite), session restore
- [ ] Day 3 — Tool-use rendering (Read/Edit/Bash inline cards with diffs)
- [ ] Day 4 — Skills loader (`~/.sworde/skills/` and `~/.claude/skills/`)
- [ ] Day 5 — MCP server orchestration UI
- [ ] Day 6 — Permission prompts UI (per-tool / per-bash)
- [ ] Day 7 — Settings panel, working directory picker, model picker
- [ ] Day 8 — Markdown polish (shiki syntax highlight, mermaid diagrams)
- [ ] Day 9 — Drag-drop files into chat
- [ ] Day 10 — Hooks system + visible activity feed
- [ ] Day 11 — Plan mode UX
- [ ] Day 12 — Mac code signing + notarization
- [ ] Day 13 — Landing page (sworde.dev)
- [ ] Day 14 — Demo video, screenshots, README polish
- [ ] Day 15 — Launch (Show HN, Twitter, IndieHackers, r/ClaudeAI)

## Disclaimer

Sworde is not affiliated with, endorsed by, or supported by Anthropic.

The project uses your existing Claude Code credentials via the official Claude
Agent SDK as a runtime dependency, the same way any other third-party tool
would. The Agent SDK is proprietary and governed by
[Anthropic's Commercial Terms](https://www.anthropic.com/legal/commercial-terms).

## License

MIT
