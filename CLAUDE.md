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
index.html          Vite entry HTML; the landing page markup lives here
privacy.html        GDPR privacy policy
contact.html        contact details / controller identification
src/main.js         entry point — wires the page up to the pattern module
src/pattern.js      glyph mapping + SVG pattern rendering (no DOM access)
src/styles/main.css Tailwind entry + @theme tokens
public/             copied to the build root as-is (favicon, fonts)
vite.config.js      Tailwind plugin + the GitHub Pages `base` path
.github/workflows/  GitHub Actions; deploy.yml publishes to Pages
prompts.md          the task prompts driving this repo's development
```

`index.html` at the repo root is the Vite entry — Vite resolves `/src/...` paths
in it against the project root, so keep those absolute-from-root. Anything in
`public/` is referenced from the root instead (`/favicon.svg`, `/fonts/*.woff2`).

The landing page's look comes from CloudCannon's MIT-licensed
[SendIt](https://github.com/CloudCannon/sendit-astro-template) template: primary
`#e71818`, secondary `#ffffff`, link `#f5e30d`, Sora for headings and UI, Space
Grotesk for body copy, `max-w-7xl` containers, `py-16 sm:py-20` sections, and a
black band for the closing content section and footer. Those tokens live in the
`@theme` block; reach for `primary`/`secondary`/`link` rather than hard-coding
hex values.

Both fonts are self-hosted from `public/fonts` — the page makes no external
requests at all, so it works offline and behind a strict network policy. Only
weights 400–700 exist as files, so do **not** use `font-extrabold` or heavier:
the browser would synthesise the weight instead. See `public/fonts/README.md`
for provenance and licensing.

## Deployment

The site is published to GitHub Pages at
<https://5deen.github.io/crypto-patterns/> by `.github/workflows/deploy.yml`,
which builds on every push to `main` and uploads `dist/` as a Pages artifact.
The Pages source in repository settings must be set to **GitHub Actions**, not
"Deploy from a branch".

Because a project repo is served from a subpath rather than the domain root,
`vite.config.js` sets `base: '/crypto-patterns/'`. Vite rewrites the absolute
URLs it owns — script and stylesheet tags, `<link rel="preload">`, and `url()`
in CSS — but **not** plain `href` attributes on anchors. So an in-site link must
be written relative (`href="./"`, `href="#demo"`); `href="/"` would silently
leave the project site and land on the user's root Pages domain. The `base`
value applies to `npm run dev` and `npm run preview` as well, so both serve from
`/crypto-patterns/` and match production. Renaming the repo means changing that
one line.

## Legal pages

`privacy.html` and `contact.html` are plain static pages in the same SendIt
style. Two things about them are load-bearing:

- **Each page is a separate Vite entry.** Vite only discovers `index.html` by
  itself, so any new page has to be added to `build.rollupOptions.input` in
  `vite.config.js` or it is silently missing from `dist/`.
- **The privacy policy makes factual claims about the site**: no cookies, no
  analytics, no external requests, nothing in `localStorage`/`sessionStorage`,
  and the demo phrase never leaving the browser. Adding an embed, a CDN asset,
  a font service, an analytics snippet or a form would falsify one of them.
  If you add anything of that kind, update `privacy.html` in the same change.

There is no shared layout — the header and footer markup is duplicated across
the three pages. Editing navigation means editing all three. Sub-page links
back into the landing page's sections are written `./#demo`, since those
anchors do not exist on the sub-page itself.

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
