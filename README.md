<div align="center">

# Sworde

**Open-source desktop client for Claude.**
Sign in with your Claude subscription. Your data stays local.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Electron](https://img.shields.io/badge/Built%20with-Electron-47848f.svg?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Built with React](https://img.shields.io/badge/React-18-61dafb.svg?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/adityaswaroop823/sworde/pulls)

</div>

---

Sworde is a native desktop client for Anthropic's Claude, built on the official
[Claude Agent SDK](https://docs.anthropic.com/claude/docs/claude-agent-sdk).
It uses the same authentication as Claude Code — if you've run `claude login`
once, Sworde just works with your existing Pro / Max subscription. No extra
billing, no API key paste.

A pay-per-use API key is also supported as a fallback.

## Features

- **Sign in with your Claude subscription** — auto-detects your `claude login` session
- **API key fallback** — paste once, stored locally, never transmitted anywhere except Anthropic
- **Streaming responses** with markdown + Shiki syntax highlighting
- **Multi-chat sidebar** with searchable conversation history
- **Tool-use rendering** for Read / Edit / Bash / Grep / Glob (inline cards)
- **MCP server support** — bring your own tools
- **Subagents, hooks, plan mode** — everything the Agent SDK supports
- **Image and PDF input**, web fetch / search
- **Auto-compaction** for long sessions
- **100% local** — credentials, conversations, and config never leave your device

## Installation

### Download

Pre-built installers for macOS, Windows, and Linux are available on the
[Releases](https://github.com/adityaswaroop823/sworde/releases) page.

### Build from source

```bash
git clone https://github.com/adityaswaroop823/sworde.git
cd sworde
npm install
npm run dev
```

To produce platform installers:

```bash
npm run build:mac     # .dmg
npm run build:win     # NSIS installer
npm run build:linux   # AppImage
```

## Usage

On first launch, Sworde probes for credentials in this order:

1. **Existing `claude login` session** → uses your Claude subscription
2. **Saved API key** → uses pay-per-use Anthropic API
3. **Neither** → onboarding screen with two options:
   - **Sign in with Claude** — opens Terminal so you can run `claude login`
   - **Use an API key** — paste once, stored locally

Once authenticated, just type. Slash commands, file drag-drop, and tool
permission prompts work out of the box.

## Tech stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [`@anthropic-ai/claude-agent-sdk`](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
- [`electron-store`](https://github.com/sindresorhus/electron-store) for local config
- [Shiki](https://shiki.style/) for syntax highlighting

## Contributing

Contributions are welcome. Open an [issue](https://github.com/adityaswaroop823/sworde/issues)
to discuss bigger changes first; small fixes can go straight to a PR.

```bash
git clone https://github.com/adityaswaroop823/sworde.git
cd sworde
npm install
npm run dev
```

Make sure `npm run typecheck` passes before pushing.

## Disclaimer

Sworde is not affiliated with, endorsed by, or supported by Anthropic.

The project uses your existing Claude Code credentials via the official Claude
Agent SDK as a runtime dependency, the same way any other third-party tool
would. The Agent SDK is proprietary and governed by
[Anthropic's Commercial Terms](https://www.anthropic.com/legal/commercial-terms).

## License

[MIT](LICENSE) © Aditya Swaroop
