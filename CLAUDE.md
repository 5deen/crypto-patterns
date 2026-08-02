# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

`crypto-patterns` is a text encryption method built on geometric patterns. A
crypto pattern is a two- or three-dimensional grid of coloured shapes, where each
shape corresponds to a glyph in the Latin alphabet.

The core flow:

1. A user enters a text password.
2. Each character is mapped to a geometric shape via the glyph mapping.
3. The system renders a **public** grid of those shapes — the pattern is safe to
   display, since it reveals nothing without the mapping rules.
4. Re-entering the password re-derives the pattern. If the character sequence
   matches the original, the regenerated pattern is identical to the one created
   when the password was defined. That identity check is the verification.

Key invariant: pattern generation must be **deterministic** — the same password
and the same mapping rules always produce a byte-identical pattern. Any
randomness has to be seeded from the password, never from `Math.random()`, the
clock, or iteration order of an unordered collection.

## Commands

```bash
npm install      # install dependencies
npm run dev      # Vite dev server with HMR
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

There is no test runner wired up yet. If you add one, add the script here.

## Stack

- **Vite 8** — dev server and bundler, ESM (`"type": "module"`).
- **Tailwind CSS 4** — via the `@tailwindcss/vite` plugin. Tailwind v4 is
  configured **in CSS**, not in a `tailwind.config.js`: `src/styles/main.css`
  does `@import 'tailwindcss'`, and theme customisation belongs in an
  `@theme { ... }` block in that file.
- Vanilla JavaScript — no framework. Keep it that way unless asked.

## Layout

```
index.html          Vite entry HTML; links src/styles/main.css and src/main.js
src/main.js         application entry point
src/styles/main.css Tailwind entry + theme customisation
prompts.md          the task prompts driving this repo's development
```

`index.html` at the repo root is the Vite entry — Vite resolves `/src/...` paths
in it against the project root, so keep those absolute-from-root.

## Conventions

- Two-space indent, single quotes, semicolons in JS.
- Prefer Tailwind utility classes in markup over hand-written CSS. Reach for
  `src/styles/main.css` only for `@theme` tokens and genuine one-offs.
- Keep the glyph mapping and pattern-generation logic free of DOM access so it
  stays testable and reusable outside the browser.

## Notes

- `prompts.md` holds the numbered prompts this project is built from. Work is
  requested as "run prompt N" — read that file for the actual task.
- Despite the name, this is a pattern/visual-encoding scheme, not a vetted
  cryptographic primitive. Do not describe it as secure encryption, and do not
  substitute it for a real cipher.
