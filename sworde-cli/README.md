# sworde

Open-source Claude desktop client. One-command install via npm — works on **macOS** and **Windows**.

```bash
npm install -g sworde
sworde
```

First run downloads the right installer from the [latest GitHub release](https://github.com/adityaswaroop823/sworde/releases/latest) and installs Sworde. Subsequent runs just launch the app.

## What is Sworde

A native desktop client built on Anthropic's official Claude Agent SDK. Sign in with your existing `claude login` session — no API key required. Includes:

- Streaming chat with tool-use rendering
- MCP server support
- Skills loader
- Trending AI news ticker (HackerNews-powered)
- Markdown rendering with syntax highlighting
- Multi-chat sidebar

Full docs and source: https://github.com/adityaswaroop823/sworde

## Requirements

- Node.js 18+
- macOS (Apple Silicon) **or** Windows (x64 / arm64)

For Linux, build from source — the npm launcher does not yet ship Linux binaries.

## How it works

1. `npm install -g sworde` installs a tiny launcher (~10 KB).
2. On first `sworde` invocation, the launcher fetches the right `.dmg` (macOS) or `.exe` (Windows) from the latest [GitHub Release](https://github.com/adityaswaroop823/sworde/releases/latest).
3. The installer is cached at `~/.sworde/cli-cache/`.
4. macOS: app is copied into `/Applications` (or `~/Applications` if write-protected). Windows: NSIS installer runs silently into your user profile (no elevation needed).
5. Every subsequent `sworde` just launches the installed app.

## Updating

```bash
npm update -g sworde      # update the launcher
sworde                    # re-runs installer if a new release exists
```

(Re-downloads only when the app is missing — to force an upgrade, delete `~/.sworde/cli-cache/` and the installed app, then `sworde` again.)

## License

MIT. Sworde is not affiliated with, endorsed by, or supported by Anthropic.
