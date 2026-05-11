# Security policy

## Supported versions

Sworde is in active early development. Only the latest published release is
supported with security fixes.

| Version | Supported |
| --- | --- |
| `0.1.x` | ✅ |
| `< 0.1` | ❌ |

## Reporting a vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

Instead, report it privately via one of the following:

1. **GitHub Security Advisory** (preferred) — open a private advisory at
   [github.com/adityaswaroop823/sworde/security/advisories/new](https://github.com/adityaswaroop823/sworde/security/advisories/new).
   This lets us collaborate on the fix in private and credit you when we
   publish.
2. **Email** — `aditya.swaroop@stage.in` with the subject line
   `Sworde Security`.

When reporting, please include:

- A clear description of the issue and its impact.
- Step-by-step reproduction (a minimal repro is ideal).
- Sworde version (`Settings → About` or `npm list -g swordeapp`).
- OS and platform.
- Any logs from `~/.sworde/auth-debug.log` if relevant.

## What to expect

- We'll acknowledge your report within **72 hours**.
- We'll keep you posted on triage, fix progress, and the disclosure timeline.
- Once a fix is shipped in a new release, we'll publish an advisory crediting
  you (unless you ask to stay anonymous).

## Scope

In scope:

- The Sworde Electron app (main + renderer + preload).
- The `swordeapp` npm launcher.
- The release pipeline (the binaries published to GitHub Releases).

Out of scope:

- The underlying **Claude Agent SDK** and the `claude` CLI — those are
  governed by Anthropic. Report SDK issues to Anthropic directly.
- Vulnerabilities that require physical access to an already-unlocked machine.
- Self-XSS or social-engineering reports without a concrete impact path.

## Credentials and local data

Sworde stores credentials and configuration in the OS keychain and in
`~/.sworde/`. Credentials are transmitted only to Anthropic's API endpoints
over HTTPS — never to any other server, including ours (there is no "ours").
