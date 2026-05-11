# Contributing to Sworde

Thanks for considering a contribution. Sworde is a small project and every PR
gets read by a human — please help that human by following these guidelines.

## Quick start

```bash
git clone https://github.com/adityaswaroop823/sworde.git
cd sworde
npm install
npm run dev
```

You'll need Node 18+ and either a `claude login` session or an
[Anthropic API key](https://console.anthropic.com/settings/keys).

## Before you open a PR

1. **For non-trivial changes, open an issue first.** A short discussion about
   approach saves both of us from a half-done PR going in the wrong direction.
2. **Search [existing issues](https://github.com/adityaswaroop823/sworde/issues)**
   to see if your bug / idea is already tracked.
3. **One logical change per PR.** Smaller PRs land faster.

## Workflow

1. **Fork** the repo and clone your fork.
2. Create a **feature branch** from `main`:
   ```bash
   git checkout -b feat/conversation-search
   ```
   Branch naming: `feat/...`, `fix/...`, `docs/...`, `chore/...`.
3. **Make focused commits** with descriptive messages. The first line should
   read like a release note (imperative, ≤ 70 chars). Body explains *why*, not
   *what*.
4. Run **`npm run typecheck`** and make sure it passes.
5. **Push** to your fork and **open a PR** against `main`. Fill out the PR
   template — it's there to make the review faster.
6. Be ready for feedback. Small change requests are common.

## Coding conventions

- **TypeScript everywhere.** Match the existing style — no semicolons in
  Tailwind classes, single quotes in JS/TS.
- **No unrelated changes.** If you spot a separate bug while in a file, file
  a new issue rather than mixing fixes.
- **Don't add new dependencies** without a clear reason. We aim for a lean
  bundle.
- **Don't edit generated files** (`out/`, `release/`, `node_modules/`).
- **Match the existing visual language** — warm bone / obsidian / ember
  palette, `display` font for headings, mono for tool output.

## What we're looking for

Roughly in order of "most useful":

1. **Bug fixes** — especially around auth flows, MCP integration, and tool-use
   rendering edge cases.
2. **Conversation persistence improvements** — search, export, archive.
3. **Platform builds** — Linux AppImage and Intel-mac DMG would be very
   welcome. Both Mac signing/notarization and Windows code-signing PRs are
   especially welcome (we'll handle the certs).
4. **Better tool-use cards** — diff rendering for Edit, file-tree for
   Glob results, etc.
5. **Performance** — reduce bundle size, improve initial load.

## What we're not looking for (right now)

- Drive-by formatting / lint-rule changes across the whole codebase.
- Adding heavy dependencies for small features.
- Rebranding / theme overhauls without prior discussion.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By
participating you agree to abide by its terms.

## License

By submitting a PR you agree that your contribution will be licensed under
the project's [MIT license](LICENSE).
